using System;
using System.Linq;
using System.Threading.Tasks;
using Windows.Services.Store;

namespace VolunCore.WindowsStore;

public sealed class SubscriptionStatus
{
    public bool IsActive { get; set; }
    public string ProductId { get; set; } = StoreSubscriptionService.MonthlySubscriptionProductId;
    public string? SkuStoreId { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
    public string? Message { get; set; }
}

public sealed class PurchaseResultDto
{
    public string ProductId { get; set; } = StoreSubscriptionService.MonthlySubscriptionProductId;
    public string Status { get; set; } = string.Empty;
    public string? ExtendedError { get; set; }
    public SubscriptionStatus Subscription { get; set; } = new();
}

public sealed class StoreSubscriptionService
{
    // Partner Center add-on Product ID / In-app offer token.
    public const string MonthlySubscriptionProductId = "vulancore_monthly";

    private readonly string _subscriptionProductId;
    private StoreContext? _context;

    public StoreSubscriptionService(string subscriptionProductId = MonthlySubscriptionProductId)
    {
        _subscriptionProductId = subscriptionProductId;
    }

    private StoreContext Context => _context ??= StoreContext.GetDefault();

    public async Task<SubscriptionStatus> CheckMonthlySubscriptionAsync()
    {
        StoreAppLicense appLicense = await Context.GetAppLicenseAsync();

        foreach (var addOnLicense in appLicense.AddOnLicenses)
        {
            StoreLicense license = addOnLicense.Value;
            bool productMatches = string.Equals(
                license.InAppOfferToken,
                _subscriptionProductId,
                StringComparison.OrdinalIgnoreCase);

            if (!productMatches)
            {
                continue;
            }

            bool hasNotExpired = license.ExpirationDate > DateTimeOffset.UtcNow;
            bool isActive = license.IsActive && hasNotExpired;

            return new SubscriptionStatus
            {
                IsActive = isActive,
                ProductId = _subscriptionProductId,
                SkuStoreId = license.SkuStoreId,
                ExpiresAt = license.ExpirationDate,
                Message = isActive ? "Active subscription" : "Subscription license is expired"
            };
        }

        return new SubscriptionStatus
        {
            IsActive = false,
            ProductId = _subscriptionProductId,
            Message = "No active subscription license found"
        };
    }

    public async Task<PurchaseResultDto> PurchaseMonthlySubscriptionAsync()
    {
        StorePurchaseResult purchaseResult =
            await Context.RequestPurchaseByInAppOfferTokenAsync(_subscriptionProductId);

        SubscriptionStatus subscription = await CheckMonthlySubscriptionAsync();

        return new PurchaseResultDto
        {
            ProductId = _subscriptionProductId,
            Status = purchaseResult.Status.ToString(),
            ExtendedError = purchaseResult.ExtendedError?.Message,
            Subscription = subscription
        };
    }

    public async Task<StoreProduct?> GetMonthlySubscriptionProductAsync()
    {
        StoreProductQueryResult queryResult =
            await Context.GetAssociatedStoreProductsByInAppOfferTokenAsync(
                new[] { _subscriptionProductId });

        if (queryResult.ExtendedError != null)
        {
            return null;
        }

        return queryResult.Products.Values.FirstOrDefault(product =>
            string.Equals(
                product.InAppOfferToken,
                _subscriptionProductId,
                StringComparison.OrdinalIgnoreCase));
    }
}
