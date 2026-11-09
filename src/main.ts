// Application Entry Point: CNG WALA — DHANMONDI SHIFT
import { StartupManager } from './engine/StartupManager';

window.addEventListener('DOMContentLoaded', () => {
  StartupManager.getInstance().bootstrap();
});
