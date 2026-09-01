using Microsoft.Data.Sqlite;
namespace StoreManagement.Data;
public static class DatabaseInitializer
{
 public static void Upgrade()
 {
  DatabasePaths.Prepare(); using var c=new SqliteConnection($"Data Source={DatabasePaths.DatabaseFile}"); c.Open();
  Exec(c,"CREATE TABLE IF NOT EXISTS Categories (Id INTEGER PRIMARY KEY AUTOINCREMENT, Name TEXT NOT NULL UNIQUE)");
  Exec(c,"CREATE TABLE IF NOT EXISTS Suppliers (Id INTEGER PRIMARY KEY AUTOINCREMENT, Name TEXT NOT NULL UNIQUE, Phone TEXT NULL, Notes TEXT NULL)");
  AddColumn(c,"Products","ImagePath","TEXT NULL"); AddColumn(c,"Sales","DebtAmount","REAL NOT NULL DEFAULT 0"); AddColumn(c,"Sales","PaymentMethod","TEXT NOT NULL DEFAULT 'Nağd'"); AddColumn(c,"Sales","CustomerName","TEXT NULL");
 }
 static void AddColumn(SqliteConnection c,string table,string name,string type){using var check=c.CreateCommand();check.CommandText=$"PRAGMA table_info({table})";using var r=check.ExecuteReader();while(r.Read())if(string.Equals(r.GetString(1),name,StringComparison.OrdinalIgnoreCase))return;Exec(c,$"ALTER TABLE {table} ADD COLUMN {name} {type}");}
 static void Exec(SqliteConnection c,string sql){using var cmd=c.CreateCommand();cmd.CommandText=sql;cmd.ExecuteNonQuery();}
}
