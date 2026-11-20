/**
 * Calculates dynamic cost-splitting and farmer net profit uplift.
 */
export function calculatePoolEconomics(pool, userWeightKg = 200) {
  const soloTruckCost = pool.baseTruckCost;
  const projectedTotalKg = Math.max(pool.currentWeightKg + userWeightKg, userWeightKg);
  const effectiveLoadKg = Math.min(projectedTotalKg, pool.maxCapacityKg);

  const costPerKg = soloTruckCost / effectiveLoadKg;
  const sharedFarmerCost = Math.round(costPerKg * userWeightKg);
  const savingsAmount = Math.max(soloTruckCost - sharedFarmerCost, 0);
  const savingsPercent = Math.round((savingsAmount / soloTruckCost) * 100);

  const middlemanRevenue = userWeightKg * pool.middlemanPricePerKg;
  const processorGross = userWeightKg * pool.processorPricePerKg;
  const processorNet = processorGross - sharedFarmerCost;
  const netGainOverMiddleman = processorNet - middlemanRevenue;

  return {
    soloTruckCost,
    sharedFarmerCost,
    savingsAmount,
    savingsPercent,
    costPerKg: costPerKg.toFixed(2),
    middlemanRevenue,
    processorGross,
    processorNet,
    netGainOverMiddleman,
  };
}
