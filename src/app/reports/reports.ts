import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FinanceService, Income, Expense } from '../services/finance.service';

export interface ReportTransaction {
  id: string;
  type: 'income' | 'expense';
  title: string;
  categoryOrSource: string;
  date: string;
  amount: number;
  description: string;
}

export interface MonthlyBarData {
  monthName: string;
  monthIndex: number;
  income: number;
  expense: number;
  net: number;
  expenseHeightPercent: number;
  incomeHeightPercent: number;
}

export interface CategorySummary {
  name: string;
  icon: string;
  total: number;
  percentage: number;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports implements OnInit {
  reportMode: 'monthly' | 'yearly' = 'monthly';

  selectedYear: number = new Date().getFullYear();
  selectedMonth: number = new Date().getMonth(); // 0-11

  availableYears: number[] = [2024, 2025, 2026, 2027];
  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  incomes: Income[] = [];
  expenses: Expense[] = [];

  // Metrics
  totalIncome = 0;
  totalExpenses = 0;
  netSavings = 0;
  savingsRate = 0;
  largestExpense = 0;
  averageMonthlyExpense = 0;
  topCategory = 'None';

  // Visuals & Statement
  statementTransactions: ReportTransaction[] = [];
  yearlyBarData: MonthlyBarData[] = [];
  categorySummaries: CategorySummary[] = [];

  searchQuery = '';
  typeFilter: 'all' | 'income' | 'expense' = 'all';

  constructor(private financeService: FinanceService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.financeService.getIncome().subscribe((incomes) => {
      this.incomes = incomes || [];
      this.financeService.getExpenses().subscribe((expenses) => {
        this.expenses = expenses || [];
        this.generateReport();
      });
    });
  }

  setMode(mode: 'monthly' | 'yearly'): void {
    this.reportMode = mode;
    this.generateReport();
  }

  onYearChange(): void {
    this.generateReport();
  }

  onMonthChange(): void {
    this.generateReport();
  }

  generateReport(): void {
    // 1. Filter transactions based on mode
    let filteredIncomes: Income[] = [];
    let filteredExpenses: Expense[] = [];

    if (this.reportMode === 'monthly') {
      filteredIncomes = this.incomes.filter((inc) => {
        const d = new Date(inc.date);
        return d.getFullYear() === Number(this.selectedYear) && d.getMonth() === Number(this.selectedMonth);
      });

      filteredExpenses = this.expenses.filter((exp) => {
        const d = new Date(exp.date);
        return d.getFullYear() === Number(this.selectedYear) && d.getMonth() === Number(this.selectedMonth);
      });
    } else {
      // Yearly
      filteredIncomes = this.incomes.filter((inc) => {
        const d = new Date(inc.date);
        return d.getFullYear() === Number(this.selectedYear);
      });

      filteredExpenses = this.expenses.filter((exp) => {
        const d = new Date(exp.date);
        return d.getFullYear() === Number(this.selectedYear);
      });
    }

    // 2. Metrics calculation
    this.totalIncome = filteredIncomes.reduce((acc, i) => acc + Number(i.amount || 0), 0);
    this.totalExpenses = filteredExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
    this.netSavings = this.totalIncome - this.totalExpenses;
    this.savingsRate = this.totalIncome > 0 ? Math.round((this.netSavings / this.totalIncome) * 100) : 0;

    this.largestExpense = filteredExpenses.length > 0 
      ? Math.max(...filteredExpenses.map((e) => Number(e.amount || 0))) 
      : 0;

    if (this.reportMode === 'yearly') {
      this.averageMonthlyExpense = Math.round(this.totalExpenses / 12);
    } else {
      this.averageMonthlyExpense = this.totalExpenses;
    }

    // 3. Category Summaries
    const catMap: { [cat: string]: number } = {};
    filteredExpenses.forEach((exp) => {
      const cat = exp.category || 'Other';
      catMap[cat] = (catMap[cat] || 0) + Number(exp.amount || 0);
    });

    const categoryIcons: { [k: string]: string } = {
      Food: '🍔',
      Transport: '🚗',
      Bills: '💡',
      Shopping: '🛍️',
      Entertainment: '🎬',
      Health: '💊',
      Education: '📚',
      Rent: '🏠',
      Other: '📦'
    };

    this.categorySummaries = Object.keys(catMap)
      .map((cat) => ({
        name: cat,
        icon: categoryIcons[cat] || '💳',
        total: catMap[cat],
        percentage: this.totalExpenses > 0 ? (catMap[cat] / this.totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);

    this.topCategory = this.categorySummaries.length > 0 
      ? `${this.categorySummaries[0].icon} ${this.categorySummaries[0].name}` 
      : 'None';

    // 4. Yearly 12-month graph calculation
    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyStats: MonthlyBarData[] = monthNamesShort.map((mName, idx) => {
      const mIncomes = this.incomes.filter((inc) => {
        const d = new Date(inc.date);
        return d.getFullYear() === Number(this.selectedYear) && d.getMonth() === idx;
      });
      const mExpenses = this.expenses.filter((exp) => {
        const d = new Date(exp.date);
        return d.getFullYear() === Number(this.selectedYear) && d.getMonth() === idx;
      });

      const mIncTotal = mIncomes.reduce((s, i) => s + Number(i.amount || 0), 0);
      const mExpTotal = mExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

      return {
        monthName: mName,
        monthIndex: idx,
        income: mIncTotal,
        expense: mExpTotal,
        net: mIncTotal - mExpTotal,
        expenseHeightPercent: 0,
        incomeHeightPercent: 0
      };
    });

    const maxVal = Math.max(
      ...monthlyStats.map((m) => Math.max(m.income, m.expense)),
      1
    );

    monthlyStats.forEach((m) => {
      m.expenseHeightPercent = Math.round((m.expense / maxVal) * 100);
      m.incomeHeightPercent = Math.round((m.income / maxVal) * 100);
    });

    this.yearlyBarData = monthlyStats;

    // 5. Statement transactions
    const incTransactions: ReportTransaction[] = filteredIncomes.map((i) => ({
      id: i._id || '',
      type: 'income',
      title: i.source,
      categoryOrSource: i.source,
      date: i.date,
      amount: Number(i.amount),
      description: i.description || ''
    }));

    const expTransactions: ReportTransaction[] = filteredExpenses.map((e) => ({
      id: e._id || '',
      type: 'expense',
      title: e.category,
      categoryOrSource: e.category,
      date: e.date,
      amount: Number(e.amount),
      description: e.description || ''
    }));

    this.statementTransactions = [...incTransactions, ...expTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  get filteredTransactions(): ReportTransaction[] {
    return this.statementTransactions.filter((t) => {
      const matchesType = this.typeFilter === 'all' || t.type === this.typeFilter;
      const q = this.searchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        t.title.toLowerCase().includes(q) || 
        t.description.toLowerCase().includes(q) || 
        t.amount.toString().includes(q) ||
        t.date.includes(q);
      return matchesType && matchesQuery;
    });
  }

  exportCSV(): void {
    const periodLabel = this.reportMode === 'monthly'
      ? `${this.months[this.selectedMonth]}_${this.selectedYear}`
      : `Year_${this.selectedYear}`;

    const headers = ['Type', 'Category/Source', 'Date', 'Description', 'Amount (Rs.)'];
    const rows = this.statementTransactions.map((t) => [
      t.type.toUpperCase(),
      `"${t.categoryOrSource.replace(/"/g, '""')}"`,
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount
    ]);

    // Add summary header lines
    const summaryLines = [
      ['FinNest Executive Financial Statement', periodLabel],
      ['Generated On', new Date().toLocaleDateString()],
      ['Total Income', this.totalIncome],
      ['Total Expenses', this.totalExpenses],
      ['Net Savings', this.netSavings],
      ['Savings Rate', `${this.savingsRate}%`],
      [],
      headers
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      summaryLines.map((e) => e.join(',')).join('\n') + '\n' +
      rows.map((e) => e.join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Financial_Report_${periodLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  printReport(): void {
    window.print();
  }
}
