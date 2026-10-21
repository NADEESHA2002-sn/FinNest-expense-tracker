import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';

export interface Income {
  _id?: string;
  amount: number;
  source: string;
  date: string;
  description?: string;
}

export interface Expense {
  _id?: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FinanceService {

  private apiUrl = 'http://localhost:5000/api';

  private dataChangedSubject = new Subject<void>();

  dataChanged$ = this.dataChangedSubject.asObservable();


  constructor(private http: HttpClient) {}


  // ================================
  // INCOME
  // ================================

  getIncome(): Observable<Income[]> {

    return this.http.get<Income[]>(
      `${this.apiUrl}/income`
    );

  }


  addIncome(income: Income): Observable<Income> {

    return this.http.post<Income>(
      `${this.apiUrl}/income`,
      income
    ).pipe(

      tap((savedIncome) => {

        console.log(
          'Income saved:',
          savedIncome
        );

        this.dataChangedSubject.next();

      })

    );

  }


  deleteIncome(id: string): Observable<any> {

    return this.http.delete(
      `${this.apiUrl}/income/${id}`
    ).pipe(

      tap(() => {

        console.log(
          'Income deleted:',
          id
        );

        this.dataChangedSubject.next();

      })

    );

  }


  // ================================
  // EXPENSE
  // ================================

  getExpenses(): Observable<Expense[]> {

    return this.http.get<Expense[]>(
      `${this.apiUrl}/expenses`
    );

  }


  addExpense(expense: Expense): Observable<Expense> {

    console.log(
      'Sending expense to backend:',
      expense
    );

    return this.http.post<Expense>(
      `${this.apiUrl}/expenses`,
      expense
    ).pipe(

      tap((savedExpense) => {

        console.log(
          'Expense saved successfully:',
          savedExpense
        );

        this.dataChangedSubject.next();

      })

    );

  }


  deleteExpense(id: string): Observable<any> {

    return this.http.delete(
      `${this.apiUrl}/expenses/${id}`
    ).pipe(

      tap(() => {

        console.log(
          'Expense deleted successfully:',
          id
        );

        this.dataChangedSubject.next();

      })

    );

  }

}
