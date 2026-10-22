import { expenseService } from "../services/expenseService";

export interface ExpensePayload {
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  category: "MAINTENANCE" | "REPAIRS" | "UTILITIES" | "INSURANCE" | "CLEANING" | "OTHER";
  description: string;
  notes: string;
  propertyAgreementId: number;
  isPaid: boolean;
  date?: string;
  currency?: string;
}

export const createExpenseFromPayload = async (payload: ExpensePayload) => {
  try {
    const response = await expenseService.createExpenseWithPayload(payload);
    return {
      success: true,
      data: response,
      message: "Expense created successfully",
    };
  } catch (error) {
    console.error("Error creating expense:", error);
    throw error;
  }
};

export const prepareExpensePayload = (data: {
  amount: number;
  category: string;
  description: string;
  notes?: string;
  propertyAgreementId: number;
  isPaid?: boolean;
}): ExpensePayload => {
  return {
    amount: data.amount,
    status: "PENDING",
    category: (data.category.toUpperCase()) as ExpensePayload["category"],
    description: data.description,
    notes: data.notes || "",
    propertyAgreementId: data.propertyAgreementId,
    isPaid: data.isPaid || false,
  };
};
