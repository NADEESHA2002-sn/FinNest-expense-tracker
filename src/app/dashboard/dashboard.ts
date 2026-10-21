import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FinanceService, Income, Expense } from '../services/finance.service';
import { AuthService } from '../services/auth.service';

export interface ExpenseCategoryItem {
  name: string;
  icon: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface MonthlyTrendItem {
  monthName: string;
  monthIndex: number;
  amount: number;
  incomeAmount: number;
  heightPercentage: number;
  isCurrent: boolean;
}

export interface MonthActivityItem {
  id: string;
  type: 'income' | 'expense';
  title: string;
  categoryOrSource: string;
  description?: string;
  amount: number;
  date: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  /* =================================
     RAW DATA
  ================================= */
  incomes: Income[] = [];
  expenses: Expense[] = [];

  /* =================================
     MONTH & YEAR FILTERING
  ================================= */
  currentDate = new Date();
  selectedYear: number = this.currentDate.getFullYear();
  selectedMonth: number = this.currentDate.getMonth(); // 0-11

  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  availableYears = [2024, 2025, 2026, 2027];

  /* =================================
     MONTHLY METRICS
  ================================= */
  monthlyIncome = 0;
  monthlyExpenses = 0;
  monthlyBalance = 0;
  monthlySavingsRate = 0;
  activeMonthIncomeCount = 0;
  activeMonthExpenseCount = 0;

  // Monthly unified activity list (both incomes and expenses)
  monthActivityList: MonthActivityItem[] = [];

  // Filter tab for monthly activity
  activityTab: 'ALL' | 'INCOME' | 'EXPENSE' = 'ALL';
  activitySearchQuery = '';

  // All-time Metrics
  totalIncomeAllTime = 0;
  totalExpensesAllTime = 0;
  balanceAllTime = 0;

  /* =================================
     CHART METRICS
  ================================= */
  incomeBarHeight = 0;
  expenseBarHeight = 0;
  monthlyTrends: MonthlyTrendItem[] = [];
  expenseCategories: ExpenseCategoryItem[] = [];

  /* =================================
     DELETE MODAL STATE
  ================================= */
  showDeleteModal = false;
  itemToDelete: { id: string; type: 'income' | 'expense'; title: string; amount: number } | null = null;

  expenseCategoriesList = [
    { name: 'Food', icon: '🍔', color: '#3b82f6' },
    { name: 'Transport', icon: '🚗', color: '#0284c7' },
    { name: 'Shopping', icon: '🛍️', color: '#6366f1' },
    { name: 'Bills', icon: '💡', color: '#8b5cf6' },
    { name: 'Entertainment', icon: '🎬', color: '#0ea5e9' },
    { name: 'Health', icon: '💊', color: '#10b981' },
    { name: 'Education', icon: '📚', color: '#2563eb' },
    { name: 'Rent', icon: '🏠', color: '#f59e0b' },
    { name: 'Other', icon: '📦', color: '#64748b' }
  ];

  /* =================================
     UI STATE
  ================================= */
  isLoading = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  constructor(
    private financeService: FinanceService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  get userName(): string {
    const user = this.authService.getCurrentUser();
    return user?.name || 'Nadeesha';
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  getTodayString(): string {
    return new Date().toISOString().substring(0, 10);
  }

  /* =================================
     DATA LOADING (Immediate Reactivity)
  ================================= */
  loadDashboardData(): void {
    this.isLoading = true;
    this.financeService.getIncome().subscribe({
      next: (incomes) => {
        this.incomes = incomes || [];
        this.financeService.getExpenses().subscribe({
          next: (expenses) => {
            this.expenses = expenses || [];
            this.calculateDashboard();
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Failed to load expenses', err);
            this.calculateDashboard();
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Failed to load income', err);
        this.calculateDashboard();
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /* =================================
     MONTH NAVIGATION
  ================================= */
  prevMonth(): void {
    if (this.selectedMonth === 0) {
      this.selectedMonth = 11;
      this.selectedYear -= 1;
    } else {
      this.selectedMonth -= 1;
    }
    this.calculateDashboard();
    this.cdr.detectChanges();
  }

  nextMonth(): void {
    if (this.selectedMonth === 11) {
      this.selectedMonth = 0;
      this.selectedYear += 1;
    } else {
      this.selectedMonth += 1;
    }
    this.calculateDashboard();
    this.cdr.detectChanges();
  }

  resetToCurrentMonth(): void {
    const now = new Date();
    this.selectedYear = now.getFullYear();
    this.selectedMonth = now.getMonth();
    this.calculateDashboard();
    this.cdr.detectChanges();
  }

  onMonthOrYearChange(): void {
    this.calculateDashboard();
    this.cdr.detectChanges();
  }

  setActivityTab(tab: 'ALL' | 'INCOME' | 'EXPENSE'): void {
    this.activityTab = tab;
    this.cdr.detectChanges();
  }

  /* =================================
     CALCULATE ALL DASHBOARD VALUES
  ================================= */
  calculateDashboard(): void {
    // 1. All-time totals
    this.totalIncomeAllTime = this.incomes.reduce((acc, i) => acc + Number(i.amount || 0), 0);
    this.totalExpensesAllTime = this.expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
    this.balanceAllTime = this.totalIncomeAllTime - this.totalExpensesAllTime;

    // 2. Filter data for the active selected month
    const activeIncomes = this.incomes.filter((inc) => {
      const d = new Date(inc.date);
      return d.getFullYear() === Number(this.selectedYear) && d.getMonth() === Number(this.selectedMonth);
    });

    const activeExpenses = this.expenses.filter((exp) => {
      const d = new Date(exp.date);
      return d.getFullYear() === Number(this.selectedYear) && d.getMonth() === Number(this.selectedMonth);
    });

    this.activeMonthIncomeCount = activeIncomes.length;
    this.activeMonthExpenseCount = activeExpenses.length;

    this.monthlyIncome = activeIncomes.reduce((acc, i) => acc + Number(i.amount || 0), 0);
    this.monthlyExpenses = activeExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
    this.monthlyBalance = this.monthlyIncome - this.monthlyExpenses;

    this.monthlySavingsRate = this.monthlyIncome > 0
      ? Math.max(0, Math.round((this.monthlyBalance / this.monthlyIncome) * 100))
      : 0;

    // 3. Build Unified Activity List (Both Incomes and Expenses)
    const combined: MonthActivityItem[] = [
      ...activeIncomes.map((inc) => ({
        id: inc._id || '',
        type: 'income' as const,
        title: inc.source || 'Income',
        categoryOrSource: inc.source || 'Income',
        description: inc.description,
        amount: Number(inc.amount || 0),
        date: inc.date,
        icon: this.getIncomeIcon(inc.source)
      })),
      ...activeExpenses.map((exp) => ({
        id: exp._id || '',
        type: 'expense' as const,
        title: exp.category || 'Expense',
        categoryOrSource: exp.category || 'Expense',
        description: exp.description,
        amount: Number(exp.amount || 0),
        date: exp.date,
        icon: this.getCategoryIcon(exp.category)
      }))
    ];

    // Sort newest first
    this.monthActivityList = combined.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // 4. Calculate Flow Comparison Bars
    const maxVal = Math.max(this.monthlyIncome, this.monthlyExpenses, 1);
    this.incomeBarHeight = Math.round((this.monthlyIncome / maxVal) * 100);
    this.expenseBarHeight = Math.round((this.monthlyExpenses / maxVal) * 100);

    // 5. 12-Month Expense Trends
    this.monthlyTrends = this.months.map((mName, mIdx) => {
      const expensesInMonth = this.expenses.filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === Number(this.selectedYear) && d.getMonth() === mIdx;
      });

      const totalExp = expensesInMonth.reduce((acc, e) => acc + Number(e.amount || 0), 0);

      const incomesInMonth = this.incomes.filter((i) => {
        const d = new Date(i.date);
        return d.getFullYear() === Number(this.selectedYear) && d.getMonth() === mIdx;
      });
      const totalInc = incomesInMonth.reduce((acc, i) => acc + Number(i.amount || 0), 0);

      return {
        monthName: mName.substring(0, 3),
        monthIndex: mIdx,
        amount: totalExp,
        incomeAmount: totalInc,
        heightPercentage: 0,
        isCurrent: mIdx === Number(this.selectedMonth)
      };
    });

    const maxTrendAmount = Math.max(...this.monthlyTrends.map((t) => t.amount), 1);
    this.monthlyTrends.forEach((t) => {
      t.heightPercentage = Math.max(8, Math.round((t.amount / maxTrendAmount) * 100));
    });

    // 6. Category Breakdown for active month
    const categoryTotals: { [key: string]: number } = {};
    activeExpenses.forEach((exp) => {
      const cat = exp.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(exp.amount || 0);
    });

    this.expenseCategories = Object.keys(categoryTotals).map((catName) => {
      const amount = categoryTotals[catName];
      const percentage = this.monthlyExpenses > 0 ? (amount / this.monthlyExpenses) * 100 : 0;
      const meta = this.expenseCategoriesList.find(
        (c) => c.name.toLowerCase() === catName.toLowerCase()
      );
      return {
        name: catName,
        icon: meta ? meta.icon : '🏷️',
        amount,
        percentage,
        color: meta ? meta.color : '#3b82f6'
      };
    });

    this.expenseCategories.sort((a, b) => b.amount - a.amount);
  }

  get filteredActivityList(): MonthActivityItem[] {
    const q = this.activitySearchQuery.toLowerCase().trim();

    return this.monthActivityList.filter((item) => {
      // Tab filter
      if (this.activityTab === 'INCOME' && item.type !== 'income') return false;
      if (this.activityTab === 'EXPENSE' && item.type !== 'expense') return false;

      // Search filter
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.amount.toString().includes(q) ||
        item.date.includes(q)
      );
    });
  }

  getCategoryIcon(categoryName: string): string {
    const found = this.expenseCategoriesList.find(
      (c) => c.name.toLowerCase() === (categoryName || '').toLowerCase()
    );
    return found ? found.icon : '💳';
  }

  getIncomeIcon(sourceName: string): string {
    const map: { [key: string]: string } = {
      salary: '💼',
      freelance: '💻',
      business: '🏢',
      investments: '📈',
      investment: '📈',
      rental: '🏠',
      bonus: '🎁',
      'side hustle': '🚀',
      other: '📦'
    };
    return map[(sourceName || '').toLowerCase()] || '💵';
  }

  /* =================================
     DELETE MODAL & ACTION
  ================================= */
  confirmDelete(id: string, type: 'income' | 'expense', title: string, amount: number): void {
    this.itemToDelete = { id, type, title, amount };
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.itemToDelete = null;
    this.cdr.detectChanges();
  }

  executeDelete(): void {
    if (!this.itemToDelete) return;

    const { id, type, title, amount } = this.itemToDelete;

    if (type === 'income') {
      this.financeService.deleteIncome(id).subscribe({
        next: () => {
          this.showToast(`Deleted ${title} (Rs. ${amount})`, 'success');
          this.cancelDelete();
          this.loadDashboardData();
        },
        error: () => {
          this.showToast('Failed to delete income', 'error');
          this.cancelDelete();
        }
      });
    } else {
      this.financeService.deleteExpense(id).subscribe({
        next: () => {
          this.showToast(`Deleted ${title} (Rs. ${amount})`, 'success');
          this.cancelDelete();
          this.loadDashboardData();
        },
        error: () => {
          this.showToast('Failed to delete expense', 'error');
          this.cancelDelete();
        }
      });
    }
  }

  showToast(msg: string, type: 'success' | 'error'): void {
    this.toastMessage = msg;
    this.toastType = type;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.toastMessage = '';
      this.cdr.detectChanges();
    }, 4000);
  }
}
