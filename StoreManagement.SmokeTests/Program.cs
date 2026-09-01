using Microsoft.EntityFrameworkCore;
using StoreManagement.Data;
using StoreManagement.Models;
using StoreManagement.Services;

var db=new StoreDbContext();
db.Database.EnsureCreated();
var service=new StoreService(db);
foreach(var old in service.FindProducts("Smoke test məhsulu")) service.DeleteProduct(old.Id);
var code="SMOKE-"+Guid.NewGuid().ToString("N");
var product=new Product{Name="Smoke test məhsulu",Barcode=code,Category="Test",PurchasePrice=1,SalePrice=2,StockQuantity=1,MinimumStock=0};
service.SaveProduct(product);
if(!service.FindProducts(code).Any(x=>x.Barcode==code)) throw new Exception("Məhsul yadda saxlanmadı.");
_ = service.Summary(DateTime.Today.AddYears(-1),DateTime.Today.AddDays(1));
_ = service.BestSelling(DateTime.Today.AddYears(-1),DateTime.Today.AddDays(1));
_ = service.MostProfitable(DateTime.Today.AddYears(-1),DateTime.Today.AddDays(1));
_ = service.GetStockReport();
service.DeleteProduct(product.Id);
Console.WriteLine("SQLite save/read və hesabat sorğuları uğurludur.");
