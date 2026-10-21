import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FinanceService, Expense } from '../services/finance.service';

@Component({
  selector: 'app-expense',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule
  ],
  templateUrl: './expense.html',
  styleUrl: './expense.css'
})
export class ExpenseComponent implements OnInit {

  expenses: Expense[] = [];

  expense = {
    amount: null as number | null,
    category: 'Food',
    date: this.getTodayDateString(),
    description: ''
  };

  categories = [
    { name: 'Food', icon: '🍔' },
    { name: 'Transport', icon: '🚗' },
    { name: 'Shopping', icon: '🛍️' },
    { name: 'Bills', icon: '💡' },
    { name: 'Entertainment', icon: '🎬' },
    { name: 'Health', icon: '💊' },
    { name: 'Education', icon: '📚' },
    { name: 'Rent', icon: '🏠' },
    { name: 'Other', icon: '📦' }
  ];

  totalExpenses = 0;
  monthlyExpenses = 0;
  topCategory = 'None';

  searchQuery = '';
  selectedCategoryFilter = 'ALL';

  isSubmitting = false;

  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  showDeleteModal = false;
  itemToDelete: Expense | null = null;

  constructor(
    private financeService: FinanceService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadExpenses();
  }

  getTodayDateString(): string {
    return new Date().toISOString().substring(0, 10);
  }

  setQuickCategory(category: string): void {
    this.expense.category = category;
  }

  loadExpenses(): void {

    this.financeService.getExpenses().subscribe({

      next: (data: Expense[]) => {

        this.expenses = [...(data || [])].sort(
          (a, b) =>
            new Date(b.date).getTime() -
            new Date(a.date).getTime()
        );

        this.calculateMetrics();

        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error(
          'Failed to load expenses:',
          error
        );

        this.showToast(
          error?.error?.message ||
          'Failed to fetch expenses from backend.',
          'error'
        );

        this.cdr.detectChanges();
      }

    });
  }

  calculateMetrics(): void {

    this.totalExpenses = this.expenses.reduce(
      (total, expense) =>
        total + Number(expense.amount || 0),
      0
    );

    const today = new Date();

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const currentMonthExpenses =
      this.expenses.filter((expense) => {

        const expenseDate =
          new Date(expense.date);

        return (
          expenseDate.getFullYear() === currentYear &&
          expenseDate.getMonth() === currentMonth
        );

      });

    this.monthlyExpenses =
      currentMonthExpenses.reduce(
        (total, expense) =>
          total + Number(expense.amount || 0),
        0
      );

    const categoryTotals: {
      [category: string]: number
    } = {};

    this.expenses.forEach((expense) => {

      const category =
        expense.category || 'Other';

      const amount =
        Number(expense.amount || 0);

      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }

      categoryTotals[category] += amount;

    });

    let highestCategory = 'None';
    let highestAmount = 0;

    Object.keys(categoryTotals).forEach(
      (category) => {

        if (
          categoryTotals[category] >
          highestAmount
        ) {

          highestAmount =
            categoryTotals[category];

          highestCategory =
            category;

        }

      }
    );

    if (highestCategory === 'None') {

      this.topCategory = 'None';

    } else {

      this.topCategory =
        `${this.getCategoryIcon(highestCategory)} ${highestCategory}`;

    }

  }

  get filteredExpenses(): Expense[] {

    const query =
      this.searchQuery
        .toLowerCase()
        .trim();

    return this.expenses.filter((expense) => {

      const categoryMatches =
        this.selectedCategoryFilter === 'ALL' ||
        expense.category.toLowerCase() ===
        this.selectedCategoryFilter.toLowerCase();

      const searchMatches =
        !query ||
        expense.category.toLowerCase().includes(query) ||
        (
          expense.description &&
          expense.description.toLowerCase().includes(query)
        ) ||
        expense.amount.toString().includes(query) ||
        expense.date.includes(query);

      return (
        categoryMatches &&
        searchMatches
      );

    });

  }

  addExpense(): void {

    if (this.isSubmitting) {
      return;
    }

    if (
      this.expense.amount === null ||
      this.expense.amount === undefined ||
      Number(this.expense.amount) <= 0
    ) {

      this.showToast(
        'Please enter a valid positive amount.',
        'error'
      );

      return;
    }

    if (
      !this.expense.category ||
      !this.expense.category.trim()
    ) {

      this.showToast(
        'Please select an expense category.',
        'error'
      );

      return;
    }

    this.isSubmitting = true;

    const payload: Expense = {

      amount:
        Number(this.expense.amount),

      category:
        this.expense.category.trim(),

      date:
        this.expense.date ||
        this.getTodayDateString(),

      description:
        this.expense.description
          ? this.expense.description.trim()
          : ''

    };

    this.financeService
      .addExpense(payload)
      .subscribe({

        next: (savedExpense: Expense) => {

          this.isSubmitting = false;

          this.showToast(
            `Expense of Rs. ${savedExpense.amount} saved successfully!`,
            'success'
          );

          this.expense = {

            amount: null,

            category: 'Food',

            date:
              this.getTodayDateString(),

            description: ''

          };

          this.loadExpenses();

        },

        error: (error) => {

          console.error(
            'Expense save failed:',
            error
          );

          this.isSubmitting = false;

          this.showToast(
            error?.error?.message ||
            'Failed to save expense. Please check your backend server.',
            'error'
          );

        }

      });

  }

  confirmDelete(item: Expense): void {

    this.itemToDelete = item;

    this.showDeleteModal = true;

  }

  cancelDelete(): void {

    this.itemToDelete = null;

    this.showDeleteModal = false;

  }

  executeDelete(): void {

    if (
      !this.itemToDelete ||
      !this.itemToDelete._id
    ) {

      this.cancelDelete();

      return;

    }

    const id =
      this.itemToDelete._id;

    const category =
      this.itemToDelete.category;

    const amount =
      this.itemToDelete.amount;

    this.financeService
      .deleteExpense(id)
      .subscribe({

        next: () => {

          this.expenses =
            this.expenses.filter(
              (expense) =>
                expense._id !== id
            );

          this.calculateMetrics();

          this.cancelDelete();

          this.showToast(
            `Deleted ${category} (Rs. ${amount})`,
            'success'
          );

        },

        error: (error) => {

          console.error(
            'Delete expense failed:',
            error
          );

          this.cancelDelete();

          this.showToast(
            error?.error?.message ||
            'Failed to delete expense record.',
            'error'
          );

        }

      });

  }

  getCategoryIcon(
    categoryName: string
  ): string {

    const found =
      this.categories.find(
        (category) =>
          category.name.toLowerCase() ===
          (categoryName || '').toLowerCase()
      );

    return found
      ? found.icon
      : '💳';

  }

  showToast(
    message: string,
    type: 'success' | 'error'
  ): void {

    this.toastMessage = message;

    this.toastType = type;

    this.cdr.detectChanges();

    setTimeout(() => {

      this.toastMessage = '';

      this.cdr.detectChanges();

    }, 4000);

  }

}
