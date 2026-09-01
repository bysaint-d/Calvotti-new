using Microsoft.Data.Sqlite;

namespace StoreManagement.Data;

public static class DatabaseInitializer
{
    public static void Upgrade()
    {
        try
        {
            DatabasePaths.Prepare();
            using var c = new SqliteConnection($"Data Source={DatabasePaths.DatabaseFile}");
            c.Open();

            // Tables
            Exec(c, "CREATE TABLE IF NOT EXISTS Settings (Id INTEGER PRIMARY KEY AUTOINCREMENT, StoreName TEXT NOT NULL DEFAULT 'Calvotti Market', AllowNegativeStock INTEGER NOT NULL DEFAULT 0, ReceiptHeader TEXT NULL, ReceiptFooter TEXT NULL, CurrencySymbol TEXT NOT NULL DEFAULT '₼', BackupPath TEXT NULL)");
            Exec(c, "CREATE TABLE IF NOT EXISTS Categories (Id INTEGER PRIMARY KEY AUTOINCREMENT, Name TEXT NOT NULL UNIQUE)");
            Exec(c, "CREATE TABLE IF NOT EXISTS Suppliers (Id INTEGER PRIMARY KEY AUTOINCREMENT, Name TEXT NOT NULL UNIQUE, Phone TEXT NULL, Notes TEXT NULL)");
            Exec(c, "CREATE TABLE IF NOT EXISTS Products (Id INTEGER PRIMARY KEY AUTOINCREMENT, Barcode TEXT NULL, Name TEXT NOT NULL, Category TEXT NOT NULL, PurchasePrice REAL NOT NULL, SalePrice REAL NOT NULL, StockQuantity REAL NOT NULL, MinimumStock REAL NOT NULL, Supplier TEXT NULL, Notes TEXT NULL, ImagePath TEXT NULL, CreatedAt TEXT NOT NULL, UpdatedAt TEXT NULL)");
            Exec(c, "CREATE TABLE IF NOT EXISTS Sales (Id INTEGER PRIMARY KEY AUTOINCREMENT, Date TEXT NOT NULL, Subtotal REAL NOT NULL, Discount REAL NOT NULL, Total REAL NOT NULL, PaidAmount REAL NOT NULL, ChangeAmount REAL NOT NULL, DebtAmount REAL NOT NULL, PaymentMethod TEXT NOT NULL DEFAULT 'Nağd', CustomerName TEXT NULL, IsReturned INTEGER NOT NULL DEFAULT 0)");
            Exec(c, "CREATE TABLE IF NOT EXISTS SaleItems (Id INTEGER PRIMARY KEY AUTOINCREMENT, SaleId INTEGER NOT NULL, ProductId INTEGER NOT NULL, Quantity REAL NOT NULL, SalePrice REAL NOT NULL, CostPrice REAL NOT NULL, Total REAL NOT NULL, Profit REAL NOT NULL)");
            Exec(c, "CREATE TABLE IF NOT EXISTS Purchases (Id INTEGER PRIMARY KEY AUTOINCREMENT, ProductId INTEGER NOT NULL, Quantity REAL NOT NULL, PurchasePrice REAL NOT NULL, Supplier TEXT NULL, Notes TEXT NULL, Date TEXT NOT NULL)");
            Exec(c, "CREATE TABLE IF NOT EXISTS Expenses (Id INTEGER PRIMARY KEY AUTOINCREMENT, Category TEXT NOT NULL, Description TEXT NOT NULL, Amount REAL NOT NULL, Date TEXT NOT NULL)");
            Exec(c, "CREATE TABLE IF NOT EXISTS Incomes (Id INTEGER PRIMARY KEY AUTOINCREMENT, Category TEXT NOT NULL, Description TEXT NOT NULL, Amount REAL NOT NULL, Date TEXT NOT NULL)");
            Exec(c, "CREATE TABLE IF NOT EXISTS StockMovements (Id INTEGER PRIMARY KEY AUTOINCREMENT, ProductId INTEGER NOT NULL, Type TEXT NOT NULL, Quantity REAL NOT NULL, PreviousStock REAL NOT NULL, NewStock REAL NOT NULL, Notes TEXT NULL, Date TEXT NOT NULL)");

            // Columns
            AddColumn(c, "Products", "ImagePath", "TEXT NULL");
            AddColumn(c, "Products", "UpdatedAt", "TEXT NULL");
            AddColumn(c, "Sales", "DebtAmount", "REAL NOT NULL DEFAULT 0");
            AddColumn(c, "Sales", "PaymentMethod", "TEXT NOT NULL DEFAULT 'Nağd'");
            AddColumn(c, "Sales", "CustomerName", "TEXT NULL");
            AddColumn(c, "Sales", "IsReturned", "INTEGER NOT NULL DEFAULT 0");

            // Seed default settings row if empty
            using var checkSetting = c.CreateCommand();
            checkSetting.CommandText = "SELECT COUNT(*) FROM Settings";
            var count = Convert.ToInt64(checkSetting.ExecuteScalar());
            if (count == 0)
            {
                Exec(c, "INSERT INTO Settings (StoreName, AllowNegativeStock, CurrencySymbol) VALUES ('Calvotti Market', 0, '₼')");
            }
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Database upgrade error: {ex.Message}");
        }
    }

    static void AddColumn(SqliteConnection c, string table, string name, string type)
    {
        try
        {
            using var check = c.CreateCommand();
            check.CommandText = $"PRAGMA table_info({table})";
            using var r = check.ExecuteReader();
            while (r.Read())
            {
                if (string.Equals(r.GetString(1), name, StringComparison.OrdinalIgnoreCase))
                    return;
            }
            Exec(c, $"ALTER TABLE {table} ADD COLUMN {name} {type}");
        }
        catch { }
    }

    static void Exec(SqliteConnection c, string sql)
    {
        try
        {
            using var cmd = c.CreateCommand();
            cmd.CommandText = sql;
            cmd.ExecuteNonQuery();
        }
        catch { }
    }
}
