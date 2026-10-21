import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FinanceService, Income } from '../services/finance.service';

@Component({
  selector: 'app-income',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule
  ],
  templateUrl: './income.html',
  styleUrl: './income.css'
})
export class IncomeComponent implements OnInit {

  // =========================================================
  // INCOME DATA
  // =========================================================
  incomes: Income[] = [];

  // =========================================================
  // INCOME FORM MODEL
  // =========================================================
  income = {
    amount: null as number | null,
    source: 'Salary',
    date: this.getTodayDateString(),
    description: ''
  };

  // =========================================================
  // CATEGORIES WITH ICONS (Matches Expense Pattern)
  // =========================================================
  categories = [
    { name: 'Salary', icon: '💼' },
    { name: 'Freelance', icon: '💻' },
    { name: 'Business', icon: '🏢' },
    { name: 'Investments', icon: '📈' },
    { name: 'Rental', icon: '🏠' },
    { name: 'Bonus', icon: '🎁' },
    { name: 'Side Hustle', icon: '🚀' },
    { name: 'Other', icon: '📦' }
  ];

  // =========================================================
  // METRICS
  // =========================================================
  totalIncome = 0;
  monthlyIncome = 0;
  topCategory = 'None';

  // =========================================================
  // SEARCH & CATEGORY FILTER (Matches Expense Filter)
  // =========================================================
  searchQuery = '';
  selectedCategoryFilter = 'ALL';

  // =========================================================
  // UI STATE
  // =========================================================
  isSubmitting = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  // =========================================================
  // DELETE MODAL
  // =========================================================
  showDeleteModal = false;
  itemToDelete: Income | null = null;

  constructor(
    private financeService: FinanceService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadIncome();
  }

  getTodayDateString(): string {
    return new Date().toISOString().substring(0, 10);
  }

  setQuickCategory(category: string): void {
    this.income.source = category;
  }

  getCategoryIcon(categoryName: string): string {
    const found = this.categories.find(
      (c) => c.name.toLowerCase() === (categoryName || '').toLowerCase()
    );
    return found ? found.icon : '💵';
  }

  loadIncome(): void {
    this.financeService.getIncome().subscribe({
      next: (data) => {
        this.incomes = [...(data || [])].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.calculateMetrics();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load income:', error);
        this.showToast('Failed to fetch income data from backend.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  calculateMetrics(): void {
    // Total Income
    this.totalIncome = this.incomes.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    // Current Month Income
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const thisMonthIncomes = this.incomes.filter((i) => {
      const d = new Date(i.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    this.monthlyIncome = thisMonthIncomes.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    // Find Top Category/Source
    const categoryTotals: { [key: string]: number } = {};
    this.incomes.forEach((item) => {
      const cat = item.source || 'Other';
      const amt = Number(item.amount || 0);
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    });

    let highestCat = 'None';
    let highestAmt = 0;
    Object.keys(categoryTotals).forEach((cat) => {
      if (categoryTotals[cat] > highestAmt) {
        highestAmt = categoryTotals[cat];
        highestCat = cat;
      }
    });

    if (highestCat === 'None') {
      this.topCategory = 'None';
    } else {
      this.topCategory = `${this.getCategoryIcon(highestCat)} ${highestCat}`;
    }
  }

  get filteredIncomes(): Income[] {
    const q = this.searchQuery.toLowerCase().trim();

    return this.incomes.filter((item) => {
      const matchesCategory =
        this.selectedCategoryFilter === 'ALL' ||
        item.source.toLowerCase() === this.selectedCategoryFilter.toLowerCase();

      const matchesQuery =
        !q ||
        item.source.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.amount.toString().includes(q) ||
        item.date.includes(q);

      return matchesCategory && matchesQuery;
    });
  }

  addIncome(): void {
    if (!this.income.amount || Number(this.income.amount) <= 0) {
      this.showToast('Please enter a valid positive amount.', 'error');
      return;
    }

    if (!this.income.source || !this.income.source.trim()) {
      this.showToast('Please select or enter an income category.', 'error');
      return;
    }

    this.isSubmitting = true;

    const payload: Income = {
      amount: Number(this.income.amount),
      source: this.income.source.trim(),
      date: this.income.date || this.getTodayDateString(),
      description: this.income.description ? this.income.description.trim() : ''
    };

    this.financeService.addIncome(payload).subscribe({
      next: (saved) => {
        this.showToast(`Income of Rs. ${payload.amount} added successfully!`, 'success');
        this.isSubmitting = false;

        // Reset form
        this.income = {
          amount: null,
          source: 'Salary',
          date: this.getTodayDateString(),
          description: ''
        };

        this.loadIncome();
      },
      error: (error) => {
        console.error('Failed to add income:', error);
        this.isSubmitting = false;
        this.showToast('Failed to save income. Please check backend connection.', 'error');
      }
    });
  }

  // =========================================================
  // DELETE HANDLING
  // =========================================================
  confirmDelete(item: Income): void {
    this.itemToDelete = item;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.itemToDelete = null;
    this.showDeleteModal = false;
  }

  executeDelete(): void {
    if (!this.itemToDelete || !this.itemToDelete._id) {
      this.cancelDelete();
      return;
    }

    const { _id, source, amount } = this.itemToDelete;
    this.financeService.deleteIncome(_id).subscribe({
      next: () => {
        this.showToast(`Deleted ${source} (Rs. ${amount})`, 'success');
        this.cancelDelete();
        this.loadIncome();
      },
      error: () => {
        this.showToast('Failed to delete income record.', 'error');
        this.cancelDelete();
      }
    });
  }

  showToast(msg: string, type: 'success' | 'error'): void {
    this.toastMessage = msg;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = '';
    }, 4000);
  }
}
