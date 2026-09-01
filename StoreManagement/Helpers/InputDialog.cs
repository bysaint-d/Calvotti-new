using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;

namespace StoreManagement.Helpers;

public static class InputDialog
{
    public static string? Prompt(string title, string message, string defaultText = "")
    {
        var win = new Window
        {
            Title = title,
            Width = 420,
            Height = 220,
            WindowStartupLocation = WindowStartupLocation.CenterScreen,
            ResizeMode = ResizeMode.NoResize,
            Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#0F172A")),
            FontFamily = new FontFamily("Segoe UI, Arial"),
            WindowStyle = WindowStyle.ToolWindow
        };

        var root = new Grid { Margin = new Thickness(20) };
        root.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
        root.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
        root.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });

        var msgText = new TextBlock
        {
            Text = message,
            Foreground = Brushes.White,
            FontSize = 13,
            FontWeight = FontWeights.SemiBold,
            TextWrapping = TextWrapping.Wrap,
            Margin = new Thickness(0, 0, 0, 12)
        };
        Grid.SetRow(msgText, 0);
        root.Children.Add(msgText);

        var txt = new TextBox
        {
            Text = defaultText,
            FontSize = 14,
            FontWeight = FontWeights.Bold,
            Padding = new Thickness(8),
            Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#1E293B")),
            Foreground = Brushes.White,
            BorderBrush = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#334155")),
            Margin = new Thickness(0, 0, 0, 16)
        };
        Grid.SetRow(txt, 1);
        root.Children.Add(txt);

        var btnPanel = new StackPanel
        {
            Orientation = Orientation.Horizontal,
            HorizontalAlignment = HorizontalAlignment.Right
        };
        Grid.SetRow(btnPanel, 2);

        var btnCancel = new Button
        {
            Content = "Ləğv et",
            Width = 90,
            Height = 32,
            Margin = new Thickness(0, 0, 8, 0),
            Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#334155")),
            Foreground = Brushes.White,
            BorderThickness = new Thickness(0)
        };
        btnCancel.Click += (_, _) => { win.DialogResult = false; win.Close(); };

        var btnOk = new Button
        {
            Content = "Təsdiq et",
            Width = 90,
            Height = 32,
            Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#EF4444")),
            Foreground = Brushes.White,
            FontWeight = FontWeights.Bold,
            BorderThickness = new Thickness(0)
        };
        btnOk.Click += (_, _) => { win.DialogResult = true; win.Close(); };

        txt.KeyDown += (s, e) =>
        {
            if (e.Key == System.Windows.Input.Key.Enter)
            {
                win.DialogResult = true;
                win.Close();
            }
            else if (e.Key == System.Windows.Input.Key.Escape)
            {
                win.DialogResult = false;
                win.Close();
            }
        };

        btnPanel.Children.Add(btnCancel);
        btnPanel.Children.Add(btnOk);
        root.Children.Add(btnPanel);

        win.Content = root;
        txt.Focus();
        txt.SelectAll();

        var res = win.ShowDialog();
        return res == true ? txt.Text : null;
    }
}
