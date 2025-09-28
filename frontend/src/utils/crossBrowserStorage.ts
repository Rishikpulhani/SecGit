// Cross-browser storage utility for submissions
// This simulates a shared storage that works across browsers for demo purposes

class CrossBrowserStorage {
  private static instance: CrossBrowserStorage;
  private storage: any[] = [];
  private listeners: Array<(data: any[]) => void> = [];

  private constructor() {
    // Initialize with any existing localStorage data
    this.loadFromLocalStorage();
    
    // Set up periodic sync (every 5 seconds)
    setInterval(() => {
      this.syncWithLocalStorage();
    }, 5000);
  }

  public static getInstance(): CrossBrowserStorage {
    if (!CrossBrowserStorage.instance) {
      CrossBrowserStorage.instance = new CrossBrowserStorage();
    }
    return CrossBrowserStorage.instance;
  }

  private loadFromLocalStorage(): void {
    try {
      const localData = localStorage.getItem('allSubmissions');
      if (localData) {
        this.storage = JSON.parse(localData);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      this.storage = [];
    }
  }

  private syncWithLocalStorage(): void {
    try {
      const localData = localStorage.getItem('allSubmissions');
      if (localData) {
        const parsedData = JSON.parse(localData);
        console.log('🔄 Syncing with localStorage, found:', parsedData.length, 'submissions');
        
        // Merge with current storage
        const oldLength = this.storage.length;
        this.storage = this.mergeArrays(this.storage, parsedData);
        
        if (this.storage.length !== oldLength) {
          console.log('📈 Storage updated:', oldLength, '->', this.storage.length, 'submissions');
          this.notifyListeners();
        }
      }
    } catch (error) {
      console.error('Error syncing with localStorage:', error);
    }
  }

  private mergeArrays(arr1: any[], arr2: any[]): any[] {
    const merged = [...arr1];
    
    arr2.forEach(item2 => {
      const existingIndex = merged.findIndex(item1 => item1.id === item2.id);
      if (existingIndex >= 0) {
        // Update existing item
        merged[existingIndex] = item2;
      } else {
        // Add new item
        merged.push(item2);
      }
    });
    
    return merged;
  }

  public getSubmissions(): any[] {
    return [...this.storage];
  }

  public addSubmission(submission: any): void {
    const existingIndex = this.storage.findIndex(item => item.id === submission.id);
    if (existingIndex >= 0) {
      this.storage[existingIndex] = submission;
      console.log('🔄 Updated existing submission:', submission.id);
    } else {
      this.storage.push(submission);
      console.log('➕ Added new submission:', submission.id);
    }
    
    // Save to localStorage
    localStorage.setItem('allSubmissions', JSON.stringify(this.storage));
    console.log('💾 Saved to localStorage, total submissions:', this.storage.length);
    this.notifyListeners();
  }

  public updateSubmission(submissionId: number, updates: Partial<any>): void {
    const index = this.storage.findIndex(item => item.id === submissionId);
    if (index >= 0) {
      this.storage[index] = { ...this.storage[index], ...updates };
      localStorage.setItem('allSubmissions', JSON.stringify(this.storage));
      this.notifyListeners();
    }
  }

  public subscribe(callback: (data: any[]) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener([...this.storage]);
      } catch (error) {
        console.error('Error notifying listener:', error);
      }
    });
  }

  // Force refresh from localStorage
  public refresh(): void {
    console.log('🔄 Manual refresh triggered');
    this.loadFromLocalStorage();
    this.syncWithLocalStorage();
    this.notifyListeners();
  }
}

export const crossBrowserStorage = CrossBrowserStorage.getInstance();

// Utility functions for easier usage
export const getSubmissions = () => crossBrowserStorage.getSubmissions();
export const addSubmission = (submission: any) => crossBrowserStorage.addSubmission(submission);
export const updateSubmission = (id: number, updates: Partial<any>) => crossBrowserStorage.updateSubmission(id, updates);
export const subscribeToSubmissions = (callback: (data: any[]) => void) => crossBrowserStorage.subscribe(callback);
export const refreshSubmissions = () => crossBrowserStorage.refresh();
