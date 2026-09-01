using System.IO;
namespace StoreManagement.Data;
public static class DatabasePaths
{
 public static string DataDirectory => Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Calvotti", "Data");
 public static string DatabaseFile => Path.Combine(DataDirectory, "store.db");
 public static void Prepare()
 {
  Directory.CreateDirectory(DataDirectory);
  var legacy=Path.Combine(AppContext.BaseDirectory,"Data","store.db");
  if(!File.Exists(DatabaseFile) && File.Exists(legacy)) File.Copy(legacy,DatabaseFile);
 }
}
