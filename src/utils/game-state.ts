/**
 * GameState class to manage timing data for games
 * Provides structured localStorage management for game timing
 */
export default class GameState<T> {
  private startTime: number | null = null;
  private endTime: number | null = null;
  private data!: T;

  public get hasStarted(): boolean { return this.startTime !== null; }
  public get hasEnded(): boolean { return this.endTime !== null; }

  public get duration(): number | null {
    return this.hasStarted && this.hasEnded ? this.endTime! - this.startTime! : null;
  }

  public get formattedDuration(): string {
    const duration = this.duration;
    if (duration === null) return '';

    const totalSeconds = Math.floor(duration / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  private constructor(private seed: number, private gameName: string) { }

  public static Get<T>(seed: number, gameName: string, type: { new(): T; }): GameState<T> {
    const state = new GameState<T>(seed, gameName);
    state.loadFromStorage();

    if (!state.data) {
      state.data = new type();
    }

    return state;
  }

  startGame(): void {
    if (this.hasStarted) return;

    this.startTime = Date.now();
    this.saveToStorage();
  }

  endGame(): void {
    if (!this.hasStarted || this.hasEnded) return;

    this.endTime = Date.now();
    this.saveToStorage();
  }

  getData(): T { return this.data; }

  updateData(setter: (data: T) => void): void {
    setter(this.data);
    this.saveToStorage();
  }

  private getStorageKey(): string {
    return `game_state_${this.gameName}_${this.seed}`;
  }

  private saveToStorage(): void {
    localStorage.setItem(this.getStorageKey(), JSON.stringify(this));
  }

  private loadFromStorage() {
    const saved = localStorage.getItem(this.getStorageKey());

    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      Object.assign(this, data);
    } catch (e) {
      console.error('Failed to load game state:', e);
    }
  }
  
  clearFromStorage(): void {
    localStorage.removeItem(this.getStorageKey());
  }
}
