using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Web.WebView2.Core;

namespace VolunCore.WindowsStore;

public sealed class WebView2StoreBridge
{
    private readonly CoreWebView2 _webView;
    private readonly StoreSubscriptionService _storeSubscriptionService;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public WebView2StoreBridge(
        CoreWebView2 webView,
        StoreSubscriptionService storeSubscriptionService)
    {
        _webView = webView;
        _storeSubscriptionService = storeSubscriptionService;
        _webView.Settings.IsWebMessageEnabled = true;
        _webView.WebMessageReceived += HandleWebMessageReceived;
    }

    private async void HandleWebMessageReceived(
        object? sender,
        CoreWebView2WebMessageReceivedEventArgs args)
    {
        StoreBridgeRequest? request;

        try
        {
            request = JsonSerializer.Deserialize<StoreBridgeRequest>(
                args.WebMessageAsJson,
                _jsonOptions);
        }
        catch (JsonException)
        {
            return;
        }

        if (request == null || string.IsNullOrWhiteSpace(request.RequestId))
        {
            return;
        }

        StoreBridgeResponse response;

        try
        {
            object payload = request.Type switch
            {
                "store.checkSubscription" =>
                    await _storeSubscriptionService.CheckMonthlySubscriptionAsync(),
                "store.purchaseMonthly" =>
                    await _storeSubscriptionService.PurchaseMonthlySubscriptionAsync(),
                _ => new { message = $"Unknown store bridge action: {request.Type}" }
            };

            response = new StoreBridgeResponse
            {
                RequestId = request.RequestId,
                Type = $"{request.Type}.result",
                Ok = true,
                Payload = payload
            };
        }
        catch (Exception exception)
        {
            response = new StoreBridgeResponse
            {
                RequestId = request.RequestId,
                Type = $"{request.Type}.result",
                Ok = false,
                Error = exception.Message
            };
        }

        _webView.PostWebMessageAsJson(JsonSerializer.Serialize(response, _jsonOptions));
    }

    private sealed class StoreBridgeRequest
    {
        public string RequestId { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
    }

    private sealed class StoreBridgeResponse
    {
        public string RequestId { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public bool Ok { get; set; }
        public object? Payload { get; set; }
        public string? Error { get; set; }
    }
}
