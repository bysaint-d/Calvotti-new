using System.Windows; using System.Windows.Input;
namespace StoreManagement.Helpers;
public static class BarcodeEnterBehavior
{
 public static readonly DependencyProperty CommandProperty=DependencyProperty.RegisterAttached("Command",typeof(ICommand),typeof(BarcodeEnterBehavior),new PropertyMetadata(null,Changed));
 public static void SetCommand(DependencyObject o,ICommand value)=>o.SetValue(CommandProperty,value);
 public static ICommand GetCommand(DependencyObject o)=>(ICommand)o.GetValue(CommandProperty);
 static void Changed(DependencyObject d,DependencyPropertyChangedEventArgs e)
 { if(d is UIElement el){el.PreviewKeyDown-=KeyDown; if(e.NewValue!=null)el.PreviewKeyDown+=KeyDown;} }
 static void KeyDown(object sender,KeyEventArgs e)
 { if(e.Key!=Key.Enter)return; var cmd=GetCommand((DependencyObject)sender); if(cmd?.CanExecute(null)==true){cmd.Execute(null);e.Handled=true;} }
}
