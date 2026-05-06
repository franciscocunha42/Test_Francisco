// Supabase database types for VowPlan

export type MemberRole = "owner" | "partner" | "planner" | "viewer";
export type TaskStatus = "not_started" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";
export type VendorCategory =
  | "venue" | "catering" | "dj" | "music" | "photography" | "videography"
  | "flowers" | "cake" | "transport" | "makeup" | "dress" | "suit"
  | "stationery" | "other";
export type VendorStatus = "researching" | "contacted" | "shortlisted" | "booked" | "rejected";
export type InvitationStatus = "not_sent" | "sent" | "opened" | "responded";
export type RsvpStatus = "pending" | "attending" | "not_attending";
export type FormType = "rsvp" | "dietary" | "song_request" | "travel" | "custom";
export type QuestionType = "text" | "textarea" | "select" | "checkbox" | "radio" | "email" | "phone";
export type PaymentStatus = "unpaid" | "deposit_paid" | "partially_paid" | "paid";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Wedding {
  id: string;
  name: string;
  partner_one_name: string;
  partner_two_name: string;
  wedding_date: string | null;
  venue_name: string | null;
  location: string | null;
  total_budget: number;
  currency: string;
  created_by: string;
  created_at: string;
}

export interface WeddingMember {
  id: string;
  wedding_id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
}

export interface TimelineTask {
  id: string;
  wedding_id: string;
  title: string;
  description: string | null;
  category: string | null;
  due_date: string | null;
  status: TaskStatus;
  completed_at: string | null;
  priority: TaskPriority;
  assigned_to: string | null;
  sort_order: number;
  created_at: string;
}

export interface Vendor {
  id: string;
  wedding_id: string;
  name: string;
  category: VendorCategory;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  quoted_price: number | null;
  actual_cost: number | null;
  status: VendorStatus;
  notes: string | null;
  contract_file_url: string | null;
  subcategory: string | null;
  min_capacity: number | null;
  max_capacity: number | null;
  price_per_person: number | null;
  rating: number | null;
  created_at: string;
}

export interface Guest {
  id: string;
  wedding_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  party_name: string | null;
  invitation_status: InvitationStatus;
  rsvp_status: RsvpStatus;
  meal_choice: string | null;
  dietary_requirements: string | null;
  plus_one_allowed: boolean;
  plus_one_name: string | null;
  notes: string | null;
  table_id: string | null;
  created_at: string;
}

export interface SeatingTable {
  id: string;
  wedding_id: string;
  name: string;
  capacity: number;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

export interface RsvpConfig {
  meal_options?: string[];
  allow_new_guests?: boolean;
  deadline?: string | null;
}

export interface Form {
  id: string;
  wedding_id: string;
  title: string;
  description: string | null;
  type: FormType;
  public_slug: string;
  is_active: boolean;
  config_json: RsvpConfig | null;
  created_at: string;
}

export interface FormQuestion {
  id: string;
  form_id: string;
  question_text: string;
  question_type: QuestionType;
  options_json: string[] | null;
  required: boolean;
  sort_order: number;
}

export interface FormResponse {
  id: string;
  form_id: string;
  guest_id: string | null;
  response_json: Record<string, unknown>;
  submitted_at: string;
}

export interface BudgetCategory {
  id: string;
  wedding_id: string;
  name: string;
  planned_amount: number;
  actual_amount: number;
  created_at: string;
}

export interface Expense {
  id: string;
  wedding_id: string;
  category_id: string | null;
  vendor_id: string | null;
  title: string;
  planned_amount: number;
  actual_amount: number;
  payment_status: PaymentStatus;
  due_date: string | null;
  paid_date: string | null;
  notes: string | null;
  receipt_file_url: string | null;
  created_at: string;
}

// The & Record<string, unknown> intersection is required so each Row/Insert/Update type
// satisfies `extends Record<string, unknown>` in @supabase/postgrest-js GenericTable
// conditional type checks — plain interfaces and object types don't satisfy this in TS.
type DR<T> = T & Record<string, unknown>;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: DR<Profile>;
        Insert: DR<Omit<Profile, "created_at">>;
        Update: DR<Partial<Profile>>;
        Relationships: [];
      };
      weddings: {
        Row: DR<Wedding>;
        Insert: DR<Omit<Wedding, "id" | "created_at">>;
        Update: DR<Partial<Wedding>>;
        Relationships: [];
      };
      wedding_members: {
        Row: DR<WeddingMember>;
        Insert: DR<Omit<WeddingMember, "id" | "created_at">>;
        Update: DR<Partial<WeddingMember>>;
        Relationships: [];
      };
      timeline_tasks: {
        Row: DR<TimelineTask>;
        Insert: DR<Omit<TimelineTask, "id" | "created_at">>;
        Update: DR<Partial<TimelineTask>>;
        Relationships: [];
      };
      vendors: {
        Row: DR<Vendor>;
        Insert: DR<Omit<Vendor, "id" | "created_at">>;
        Update: DR<Partial<Vendor>>;
        Relationships: [];
      };
      guests: {
        Row: DR<Guest>;
        Insert: DR<Omit<Guest, "id" | "created_at">>;
        Update: DR<Partial<Guest>>;
        Relationships: [];
      };
      forms: {
        Row: DR<Form>;
        Insert: DR<Omit<Form, "id" | "created_at">>;
        Update: DR<Partial<Form>>;
        Relationships: [];
      };
      form_questions: {
        Row: DR<FormQuestion>;
        Insert: DR<Omit<FormQuestion, "id">>;
        Update: DR<Partial<FormQuestion>>;
        Relationships: [];
      };
      form_responses: {
        Row: DR<FormResponse>;
        Insert: DR<Omit<FormResponse, "id" | "submitted_at">>;
        Update: DR<Partial<FormResponse>>;
        Relationships: [];
      };
      budget_categories: {
        Row: DR<BudgetCategory>;
        Insert: DR<Omit<BudgetCategory, "id" | "created_at">>;
        Update: DR<Partial<BudgetCategory>>;
        Relationships: [];
      };
      expenses: {
        Row: DR<Expense>;
        Insert: DR<Omit<Expense, "id" | "created_at">>;
        Update: DR<Partial<Expense>>;
        Relationships: [];
      };
      seating_tables: {
        Row: DR<SeatingTable>;
        Insert: DR<Omit<SeatingTable, "id" | "created_at">>;
        Update: DR<Partial<SeatingTable>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_wedding_member: { Args: DR<{ p_wedding_id: string }>; Returns: boolean };
    };
    Enums: {
      member_role: MemberRole;
      task_status: TaskStatus;
      task_priority: TaskPriority;
      vendor_category: VendorCategory;
      vendor_status: VendorStatus;
      invitation_status: InvitationStatus;
      rsvp_status: RsvpStatus;
      form_type: FormType;
      question_type: QuestionType;
      payment_status: PaymentStatus;
    };
  };
}
