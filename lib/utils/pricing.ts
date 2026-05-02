export function calculateOrderTotal(
    items: any[],
    dbProducts: Map<string, number>,
    dbBundles: Map<string, number>,
    dbBundleItems: any[]
) {
    let finalOrderTotal = 0;

    // Group submitted product quantities by bundleId
    const bundleItemGroups = items.reduce((acc, currentItem) => {
        const itemDbPrice = dbProducts.get(currentItem.productId);
        if (itemDbPrice === undefined) {
            throw new Error(`Invalid product selected: ${currentItem.productId}`);
        }
        currentItem.price = itemDbPrice;

        if (currentItem.bundleId) {
            acc[currentItem.bundleId] = acc[currentItem.bundleId] || {};
            acc[currentItem.bundleId][currentItem.productId] = (acc[currentItem.bundleId][currentItem.productId] || 0) + currentItem.quantity;
        } else {
            finalOrderTotal += currentItem.price * currentItem.quantity;
        }
        return acc;
    }, {} as Record<string, Record<string, number>>);

    // Process each bundle group
    Object.entries(bundleItemGroups).forEach(([bId, groupProducts]) => {
        const prods = groupProducts as Record<string, number>;
        const reqDefs = dbBundleItems.filter(b => b.bundle_id === bId);

        const possibleCount = reqDefs.length === 0 ? 0 : Math.min(
            ...reqDefs.map(req => Math.floor((prods[req.product_id] || 0) / req.quantity))
        );

        finalOrderTotal += possibleCount * (dbBundles.get(bId) ?? 0);

        // Charge base price for any items leftover after filling the max possible bundles
        Object.entries(prods).forEach(([pId, subQty]) => {
            const defItem = reqDefs.find(r => r.product_id === pId);
            const qtyUsed = possibleCount * (defItem?.quantity || 0);
            const extra = (subQty as number) - qtyUsed;
            if (extra > 0) {
                finalOrderTotal += extra * (dbProducts.get(pId) || 0);
            }
        });
    });

    return finalOrderTotal;
}
