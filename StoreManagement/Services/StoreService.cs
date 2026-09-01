using System.IO;
using Microsoft.EntityFrameworkCore;
using StoreManagement.Data;
using StoreManagement.Models;

namespace StoreManagement.Services;

public class StoreService(StoreDbContext db)
{
    public sealed record ProductMetric(string Name, decimal Quantity, decimal Amount);
    public sealed record StockReport(int ProductCount, decimal TotalQuantity, int LowStock, int OutOfStock);

    public List<Product> FindProducts(string? q = "") =>
        db.Products.AsNoTracking()
            .Where(p => string.IsNullOrEmpty(q) || p.Name.Contains(q) || p.Category.Contains(q) || (p.Barcode ?? "").Contains(q))
            .OrderBy(p => p.Name)
            .Take(500)
            .ToList();

    public Product? ByBarcode(string code) => db.Products.FirstOrDefault(p => p.Barcode == code);

    public void SaveProduct(Product p)
    {
        if (string.IsNullOrWhiteSpace(p.Name)) throw new InvalidOperationException("Məhsul adı boş ola bilməz.");
        if (p.SalePrice < 0 || p.PurchasePrice < 0 || p.StockQuantity < 0) throw new InvalidOperationException("Qiymət və stok mənfi ola bilməz.");
        if (!string.IsNullOrWhiteSpace(p.Barcode) && db.Products.Any(x => x.Barcode == p.Barcode && x.Id != p.Id))
            throw new InvalidOperationException("Bu barkod artıq mövcuddur.");

        if (p.Id == 0)
        {
            db.Products.Add(p);
            db.SaveChanges();
            db.StockMovements.Add(new StockMovement
            {
                ProductId = p.Id,
                Type = "İlkin stok",
                Quantity = p.StockQuantity,
                PreviousStock = 0,
                NewStock = p.StockQuantity,
                Notes = "Məhsul yaradıldı"
            });
        }
        else
        {
            p.UpdatedAt = DateTime.Now;
            db.Products.Update(p);
        }
        db.SaveChanges();
    }

    public void DeleteProduct(int id, bool force = true)
    {
        var p = db.Products.Find(id) ?? throw new InvalidOperationException("Məhsul tapılmadı.");
        
        // Remove related dependent records cleanly if present
        var movements = db.StockMovements.Where(x => x.ProductId == id).ToList();
        if (movements.Count > 0) db.StockMovements.RemoveRange(movements);

        var purchases = db.Purchases.Where(x => x.ProductId == id).ToList();
        if (purchases.Count > 0) db.Purchases.RemoveRange(purchases);

        var saleItems = db.SaleItems.Where(x => x.ProductId == id).ToList();
        if (saleItems.Count > 0) db.SaleItems.RemoveRange(saleItems);

        db.Products.Remove(p);
        db.SaveChanges();
    }

    public void AdjustStock(int id, decimal change, string note)
    {
        if (change == 0) throw new InvalidOperationException("Düzəliş miqdarı 0 ola bilməz.");
        var p = db.Products.Find(id) ?? throw new InvalidOperationException("Məhsul tapılmadı.");
        if (p.StockQuantity + change < 0) throw new InvalidOperationException("Stok mənfi ola bilməz.");
        var old = p.StockQuantity;
        p.StockQuantity += change;
        p.UpdatedAt = DateTime.Now;
        db.StockMovements.Add(new StockMovement
        {
            ProductId = id,
            Type = "Stok düzəlişi",
            Quantity = change,
            PreviousStock = old,
            NewStock = p.StockQuantity,
            Notes = note
        });
        db.SaveChanges();
    }

    public void Purchase(int id, decimal qty, decimal price, string supplier, string note)
    {
        if (qty <= 0 || price < 0) throw new InvalidOperationException("Miqdar müsbət olmalıdır.");
        var p = db.Products.Find(id) ?? throw new InvalidOperationException("Məhsul tapılmadı.");
        var before = p.StockQuantity;
        p.StockQuantity += qty;
        p.PurchasePrice = price;
        p.Supplier = supplier;
        db.Purchases.Add(new Purchase
        {
            ProductId = id,
            Quantity = qty,
            PurchasePrice = price,
            Supplier = supplier,
            Notes = note
        });
        db.StockMovements.Add(new StockMovement
        {
            ProductId = id,
            Type = "Alış",
            Quantity = qty,
            PreviousStock = before,
            NewStock = p.StockQuantity,
            Notes = note
        });
        db.SaveChanges();
    }

    public void CompleteSale(IEnumerable<(int Id, decimal Qty)> rows, decimal discount, decimal paid, string paymentMethod = "Nağd", string? customerName = null)
    {
        var sale = new Sale { Discount = discount, PaymentMethod = paymentMethod, CustomerName = customerName };
        foreach (var row in rows)
        {
            var p = db.Products.Find(row.Id) ?? throw new InvalidOperationException("Məhsul tapılmadı.");
            if (row.Qty <= 0 || p.StockQuantity < row.Qty) throw new InvalidOperationException($"{p.Name} üçün stok kifayət deyil.");
            var total = p.SalePrice * row.Qty;
            sale.Items.Add(new SaleItem
            {
                ProductId = p.Id,
                Quantity = row.Qty,
                SalePrice = p.SalePrice,
                CostPrice = p.PurchasePrice,
                Total = total,
                Profit = (p.SalePrice - p.PurchasePrice) * row.Qty
            });
            p.StockQuantity -= row.Qty;
            db.StockMovements.Add(new StockMovement
            {
                ProductId = p.Id,
                Type = "Satış",
                Quantity = -row.Qty,
                PreviousStock = p.StockQuantity + row.Qty,
                NewStock = p.StockQuantity
            });
        }
        sale.Subtotal = sale.Items.Sum(x => x.Total);
        sale.Total = Math.Max(0, sale.Subtotal - discount);
        if (paymentMethod != "Borc" && paid < sale.Total) throw new InvalidOperationException("Nağd və kart satışında tam ödəniş tələb olunur.");
        if (paymentMethod == "Borc" && string.IsNullOrWhiteSpace(customerName)) throw new InvalidOperationException("Borc satışı üçün müştəri adı daxil edin.");
        sale.PaidAmount = paid;
        sale.ChangeAmount = Math.Max(0, paid - sale.Total);
        sale.DebtAmount = Math.Max(0, sale.Total - paid);
        db.Sales.Add(sale);
        db.Incomes.Add(new Income { Category = "Satış", Description = $"Satış #{sale.Id} ({paymentMethod})", Amount = sale.Total });
        db.SaveChanges();
    }

    public List<Sale> GetRecentSales(int count = 100) =>
        db.Sales.Include(x => x.Items).ThenInclude(i => i.Product)
            .OrderByDescending(x => x.Date)
            .Take(count)
            .ToList();

    public void DeleteSale(int id, bool restoreStock = true)
    {
        var sale = db.Sales.Include(x => x.Items).FirstOrDefault(x => x.Id == id) ?? throw new InvalidOperationException("Satış tapılmadı.");
        if (restoreStock && !sale.IsReturned)
        {
            foreach (var i in sale.Items)
            {
                var p = db.Products.Find(i.ProductId);
                if (p != null)
                {
                    var prev = p.StockQuantity;
                    p.StockQuantity += i.Quantity;
                    db.StockMovements.Add(new StockMovement
                    {
                        ProductId = p.Id,
                        Type = "Satış ləğvi (Geri qaytarma)",
                        Quantity = i.Quantity,
                        PreviousStock = prev,
                        NewStock = p.StockQuantity,
                        Notes = $"Satış #{id} silindi / ləğv edildi"
                    });
                }
            }
        }
        var relatedIncomes = db.Incomes.Where(x => x.Description.Contains($"Satış #{id}")).ToList();
        if (relatedIncomes.Count > 0) db.Incomes.RemoveRange(relatedIncomes);

        db.SaleItems.RemoveRange(sale.Items);
        db.Sales.Remove(sale);
        db.SaveChanges();
    }

    public void DeleteAllSales(bool restoreStock = false)
    {
        var allSales = db.Sales.Include(x => x.Items).ToList();
        if (restoreStock)
        {
            foreach (var s in allSales)
            {
                if (!s.IsReturned)
                {
                    foreach (var i in s.Items)
                    {
                        var p = db.Products.Find(i.ProductId);
                        if (p != null) p.StockQuantity += i.Quantity;
                    }
                }
            }
        }
        db.SaleItems.RemoveRange(db.SaleItems);
        db.Sales.RemoveRange(db.Sales);
        var salesIncomes = db.Incomes.Where(x => x.Category == "Satış" || x.Category == "Qaytarma").ToList();
        db.Incomes.RemoveRange(salesIncomes);
        db.SaveChanges();
    }

    public void ResetAllProductsAndData()
    {
        db.SaleItems.RemoveRange(db.SaleItems);
        db.Sales.RemoveRange(db.Sales);
        db.Purchases.RemoveRange(db.Purchases);
        db.StockMovements.RemoveRange(db.StockMovements);
        db.Incomes.RemoveRange(db.Incomes);
        db.Expenses.RemoveRange(db.Expenses);
        db.Products.RemoveRange(db.Products);
        db.SaveChanges();
    }

    public List<string> CategoryNames() => db.Categories.AsNoTracking().OrderBy(x => x.Name).Select(x => x.Name).ToList();
    public List<string> SupplierNames() => db.Suppliers.AsNoTracking().OrderBy(x => x.Name).Select(x => x.Name).ToList();

    public void AddCategory(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new InvalidOperationException("Kateqoriya adı boş ola bilməz.");
        if (!db.Categories.Any(x => x.Name == name.Trim()))
        {
            db.Categories.Add(new Category { Name = name.Trim() });
            db.SaveChanges();
        }
    }

    public void AddSupplier(string name, string? phone)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new InvalidOperationException("Təchizatçı adı boş ola bilməz.");
        if (!db.Suppliers.Any(x => x.Name == name.Trim()))
        {
            db.Suppliers.Add(new Supplier { Name = name.Trim(), Phone = phone });
            db.SaveChanges();
        }
    }

    public List<StockMovement> Movements() => db.StockMovements.AsNoTracking().OrderByDescending(x => x.Date).Take(1000).ToList();

    public void ReturnSale(int id)
    {
        var sale = db.Sales.Include(x => x.Items).FirstOrDefault(x => x.Id == id) ?? throw new InvalidOperationException("Satış tapılmadı.");
        if (sale.IsReturned) throw new InvalidOperationException("Bu satış artıq qaytarılıb.");
        foreach (var i in sale.Items)
        {
            var p = db.Products.Find(i.ProductId)!;
            p.StockQuantity += i.Quantity;
            db.StockMovements.Add(new StockMovement
            {
                ProductId = p.Id,
                Type = "Qaytarma",
                Quantity = i.Quantity,
                PreviousStock = p.StockQuantity - i.Quantity,
                NewStock = p.StockQuantity
            });
        }
        sale.IsReturned = true;
        db.Incomes.Add(new Income { Category = "Qaytarma", Description = $"Satış #{id} qaytarma", Amount = -sale.Total });
        db.SaveChanges();
    }

    public void AddExpense(Expense e)
    {
        if (e.Amount <= 0 || string.IsNullOrWhiteSpace(e.Description)) throw new InvalidOperationException("Xərc adı və məbləği daxil edin.");
        db.Expenses.Add(e);
        db.SaveChanges();
    }

    public (decimal sales, decimal gross, decimal expenses, decimal net, int count) Summary(DateTime from, DateTime to)
    {
        var sales = db.Sales.Include(x => x.Items).Where(x => x.Date >= from && x.Date < to && !x.IsReturned).ToList();
        var income = sales.Sum(x => x.Total);
        var gross = sales.Sum(x => x.Items.Sum(i => i.Profit));
        var exp = db.Expenses.Where(x => x.Date >= from && x.Date < to).Sum(x => x.Amount);
        return (income, gross, exp, gross - exp, sales.Count);
    }

    public decimal PurchasesTotal(DateTime from, DateTime to) => db.Purchases.Where(x => x.Date >= from && x.Date < to).Sum(x => x.Quantity * x.PurchasePrice);
    public decimal CostOfGoods(DateTime from, DateTime to) => db.SaleItems.Where(x => x.Sale!.Date >= from && x.Sale.Date < to && !x.Sale.IsReturned).Sum(x => x.CostPrice * x.Quantity);
    public int ProductsSold(DateTime from, DateTime to) => (int)db.SaleItems.Where(x => x.Sale!.Date >= from && x.Sale.Date < to && !x.Sale.IsReturned).Sum(x => x.Quantity);

    public List<ProductMetric> BestSelling(DateTime from, DateTime to) =>
        db.SaleItems.AsNoTracking()
            .Where(x => x.Sale!.Date >= from && x.Sale.Date < to && !x.Sale.IsReturned)
            .Select(x => new { Name = x.Product!.Name, x.Quantity, x.Total })
            .ToList()
            .GroupBy(x => x.Name)
            .Select(g => new ProductMetric(g.Key, g.Sum(x => x.Quantity), g.Sum(x => x.Total)))
            .OrderByDescending(x => x.Quantity)
            .Take(10)
            .ToList();

    public List<ProductMetric> MostProfitable(DateTime from, DateTime to) =>
        db.SaleItems.AsNoTracking()
            .Where(x => x.Sale!.Date >= from && x.Sale.Date < to && !x.Sale.IsReturned)
            .Select(x => new { Name = x.Product!.Name, x.Quantity, x.Profit })
            .ToList()
            .GroupBy(x => x.Name)
            .Select(g => new ProductMetric(g.Key, g.Sum(x => x.Quantity), g.Sum(x => x.Profit)))
            .OrderByDescending(x => x.Amount)
            .Take(10)
            .ToList();

    public StockReport GetStockReport()
    {
        var p = db.Products.AsNoTracking();
        return new(p.Count(), p.Sum(x => (decimal?)x.StockQuantity) ?? 0, p.Count(x => x.StockQuantity <= x.MinimumStock), p.Count(x => x.StockQuantity <= 0));
    }

    public void Backup(string destination)
    {
        db.Database.CloseConnection();
        File.Copy(DatabasePaths.DatabaseFile, destination, true);
    }

    public void Restore(string source)
    {
        db.Database.CloseConnection();
        File.Copy(source, DatabasePaths.DatabaseFile, true);
    }
}
