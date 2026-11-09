// Game Economy & Bangladeshi CNG Driver Daily Shift Manager
import { ShiftStats } from '../types';
import { SaveManager } from '../storage/SaveManager';

export class EconomyManager {
  private saveManager: SaveManager;

  constructor() {
    this.saveManager = SaveManager.getInstance();
  }

  // Active shift stats accessor
  public get stats(): ShiftStats {
    return this.saveManager.getStats();
  }

  // Record passenger trip completion
  public addTripEarning(fare: number, tip: number = 0): void {
    const totalFare = fare + tip;
    const stats = this.saveManager.getStats();
    const statistics = this.saveManager.getStatistics();

    stats.cash += totalFare;
    stats.todayEarnings += totalFare;
    stats.totalTripsCompleted += 1;
    stats.reputation = Math.min(100, stats.reputation + 2);

    // Lifetime statistics
    statistics.lifetimeEarnings += totalFare;
    statistics.totalTripsCompleted += 1;
    if (totalFare > statistics.highestSingleFare) {
      statistics.highestSingleFare = totalFare;
    }
    if (tip > 0) {
      statistics.tipsReceivedTotal += tip;
    }

    // Auto-pay rent if earnings exceed daily rental deposit
    if (!stats.rentPaid && stats.todayEarnings >= stats.dailyRentGoal) {
      stats.rentPaid = true;
    }

    this.saveManager.save(true);
  }

  // Refuel CNG gas cylinder at Dhanmondi filling pump
  public refuelCNG(): boolean {
    const cost = 150; // BDT
    const stats = this.saveManager.getStats();
    const statistics = this.saveManager.getStatistics();
    const upgrades = this.saveManager.getUpgrades();

    // Larger tank capacity if upgraded
    const maxFuel = 100 + (upgrades.tankCapacityLevel - 1) * 25;

    if (stats.cash >= cost && stats.fuelRemaining < maxFuel - 5) {
      stats.cash -= cost;
      stats.fuelRemaining = maxFuel;
      statistics.fuelPurchasedLiters += 15;
      this.saveManager.save(true);
      return true;
    }
    return false;
  }

  // Record distance traveled in km
  public addDistanceKm(km: number): void {
    const statistics = this.saveManager.getStatistics();
    statistics.totalDistanceKm = Math.round((statistics.totalDistanceKm + km) * 10) / 10;
  }

  // Record traffic collision/accident
  public recordAccident(): void {
    const statistics = this.saveManager.getStatistics();
    statistics.accidentsReported += 1;
    const stats = this.saveManager.getStats();
    stats.reputation = Math.max(20, stats.reputation - 3);
    this.saveManager.save(false);
  }

  // Save progress (delegated to SaveManager IndexedDB + LocalStorage)
  public saveState(): void {
    this.saveManager.save(true);
  }

  // Reset shift progression for a new day
  public resetShift(): void {
    const stats = this.saveManager.getStats();
    const statistics = this.saveManager.getStatistics();

    stats.todayEarnings = 0;
    stats.rentPaid = false;
    stats.fuelRemaining = 90;
    stats.shiftTimeMinutes = 480; // 8:00 AM
    statistics.daysOnRoad += 1;

    this.saveManager.save(true);
  }
}
