export function calculateOrderTotal(
    items: any[],
    dbProducts: Map<string, number>,
    dbBundles: Map<string, number>,
    dbBundleItems: any[]
) {
    let total = 0;
    const bundleQuantities: Record<string, Record<string, number>> = {};

    for (const item of items) {
        const dbPrice = dbProducts.get(item.productId);
        if (dbPrice === undefined) {
            throw new Error(`Invalid product selected: ${item.productId}`);
        }
        item.price = dbPrice;

        if (item.bundleId) {
            if (!bundleQuantities[item.bundleId]) bundleQuantities[item.bundleId] = {};
            bundleQuantities[item.bundleId][item.productId] = (bundleQuantities[item.bundleId][item.productId] || 0) + item.quantity;
        } else {
            total += item.price * item.quantity;
        }
    }

    for (const [bId, bProducts] of Object.entries(bundleQuantities)) {
        const bItems = dbBundleItems.filter((b: any) => b.bundle_id === bId);
        let bundleCount = Infinity;
        if (bItems.length === 0) {
            bundleCount = 0;
        } else {
            for (const req of bItems) {
                const subQty = bProducts[req.product_id] || 0;
                bundleCount = Math.min(bundleCount, Math.floor(subQty / req.quantity));
            }
        }

        const bPrice = dbBundles.get(bId) ?? 0;
        total += bundleCount * bPrice;

        for (const [pId, qty] of Object.entries(bProducts)) {
            const reqItem = bItems.find((b: any) => b.product_id === pId);
            const reqQty = reqItem ? reqItem.quantity : 0;
            const remainingQty = qty - (bundleCount * reqQty);
            if (remainingQty > 0) {
                total += remainingQty * (dbProducts.get(pId) || 0);
            }
        }
    }

    return total;
}
