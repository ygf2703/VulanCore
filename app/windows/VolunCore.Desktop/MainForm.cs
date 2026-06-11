using System;
using System.IO;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using VolunCore.WindowsStore;

namespace VolunCore.Desktop;

public sealed class MainForm : Form
{
    private readonly WebView2 _webView = new()
    {
        Dock = DockStyle.Fill,
        AllowExternalDrop = false,
    };

    private WebView2StoreBridge? _storeBridge;

    public MainForm()
    {
        Text = "VolunCore";
        MinimumSize = new System.Drawing.Size(1120, 760);
        StartPosition = FormStartPosition.CenterScreen;
        Icon = LoadWindowIcon();
        Controls.Add(_webView);
    }

    protected override async void OnShown(EventArgs e)
    {
        base.OnShown(e);
        await InitializeWebViewAsync();
    }

    private async Task InitializeWebViewAsync()
    {
        string webRoot = Path.Combine(AppContext.BaseDirectory, "WebApp");
        string indexPath = Path.Combine(webRoot, "index.html");

        if (!File.Exists(indexPath))
        {
            MessageBox.Show(
                $"VolunCore web assets were not found at:{Environment.NewLine}{indexPath}",
                "VolunCore",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            return;
        }

        CoreWebView2Environment environment = await CoreWebView2Environment.CreateAsync();
        await _webView.EnsureCoreWebView2Async(environment);

        _webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
            "app.voluncore.local",
            webRoot,
            CoreWebView2HostResourceAccessKind.Allow);

        _webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;
        _webView.CoreWebView2.Settings.AreDevToolsEnabled = true;
        _storeBridge = new WebView2StoreBridge(
            _webView.CoreWebView2,
            new StoreSubscriptionService());

        _webView.Source = new Uri("https://app.voluncore.local/index.html");
    }

    private static System.Drawing.Icon? LoadWindowIcon()
    {
        string iconPath = Path.Combine(AppContext.BaseDirectory, "Assets", "VolunCore.ico");
        return File.Exists(iconPath) ? new System.Drawing.Icon(iconPath) : null;
    }
}
