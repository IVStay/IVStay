
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "availability_blocks": {
                  Row: {
                    "created_at": string,"ends_on": string,"id": string,"note": string | null,"property_id": string,"reason": string,"starts_on": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"ends_on": string,"id"?: string,"note"?: string | null,"property_id": string,"reason"?: string,"starts_on": string
                  }
                  Update: {
                    "created_at"?: string,"ends_on"?: string,"id"?: string,"note"?: string | null,"property_id"?: string,"reason"?: string,"starts_on"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "availability_blocks_property_id_fkey"
      columns: ["property_id"]
isOneToOne: false
      referencedRelation: "properties"
      referencedColumns: ["id"]
    }
                  ]
                },"bookings": {
                  Row: {
                    "admin_notes": string | null,"adults": number,"check_in": string,"check_out": string,"children": number,"cleaning_fee_paise": number,"created_at": string,"customer_payment_date": string | null,"customer_payment_status": string,"customer_rate_paise": number | null,"extra_guest_total_paise": number,"guest_email": string | null,"guest_id": string | null,"guest_name": string,"guest_phone": string | null,"id": string,"nightly_total_paise": number,"notified_at": string | null,"nights": number | null,"owner_payment_date": string | null,"owner_payment_status": string,"owner_rate_paise": number | null,"payment_status": string,"pets": number,"property_id": string,"reference": string,"service_fee_paise": number,"source": string,"special_requests": string | null,"status": string,"stay": unknown,"total_paise": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "admin_notes"?: string | null,"adults"?: number,"check_in": string,"check_out": string,"children"?: number,"cleaning_fee_paise"?: number,"created_at"?: string,"customer_payment_date"?: string | null,"customer_payment_status"?: string,"customer_rate_paise"?: number | null,"extra_guest_total_paise"?: number,"guest_email"?: string | null,"guest_id"?: string | null,"guest_name": string,"guest_phone"?: string | null,"id"?: string,"nightly_total_paise"?: number,"notified_at"?: string | null,"nights"?: never,"owner_payment_date"?: string | null,"owner_payment_status"?: string,"owner_rate_paise"?: number | null,"payment_status"?: string,"pets"?: number,"property_id": string,"reference"?: string,"service_fee_paise"?: number,"source"?: string,"special_requests"?: string | null,"status"?: string,"stay"?: never,"total_paise"?: number,"updated_at"?: string
                  }
                  Update: {
                    "admin_notes"?: string | null,"adults"?: number,"check_in"?: string,"check_out"?: string,"children"?: number,"cleaning_fee_paise"?: number,"created_at"?: string,"customer_payment_date"?: string | null,"customer_payment_status"?: string,"customer_rate_paise"?: number | null,"extra_guest_total_paise"?: number,"guest_email"?: string | null,"guest_id"?: string | null,"guest_name"?: string,"guest_phone"?: string | null,"id"?: string,"nightly_total_paise"?: number,"notified_at"?: string | null,"nights"?: never,"owner_payment_date"?: string | null,"owner_payment_status"?: string,"owner_rate_paise"?: number | null,"payment_status"?: string,"pets"?: number,"property_id"?: string,"reference"?: string,"service_fee_paise"?: number,"source"?: string,"special_requests"?: string | null,"status"?: string,"stay"?: never,"total_paise"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "bookings_property_id_fkey"
      columns: ["property_id"]
isOneToOne: false
      referencedRelation: "properties"
      referencedColumns: ["id"]
    }
                  ]
                },"enquiries": {
                  Row: {
                    "created_at": string,"email": string | null,"id": string,"kind": string,"message": string | null,"name": string,"phone": string | null,"property_id": string | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email"?: string | null,"id"?: string,"kind": string,"message"?: string | null,"name": string,"phone"?: string | null,"property_id"?: string | null,"status"?: string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string | null,"id"?: string,"kind"?: string,"message"?: string | null,"name"?: string,"phone"?: string | null,"property_id"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "enquiries_property_id_fkey"
      columns: ["property_id"]
isOneToOne: false
      referencedRelation: "properties"
      referencedColumns: ["id"]
    }
                  ]
                },"owners": {
                  Row: {
                    "created_at": string,"email": string | null,"id": string,"name": string,"notes": string | null,"payout_details": string | null,"phone": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email"?: string | null,"id"?: string,"name": string,"notes"?: string | null,"payout_details"?: string | null,"phone"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string | null,"id"?: string,"name"?: string,"notes"?: string | null,"payout_details"?: string | null,"phone"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"payments": {
                  Row: {
                    "amount_paise": number,"booking_id": string,"created_at": string,"currency": string,"id": string,"provider": string,"provider_order_id": string | null,"provider_payment_id": string | null,"provider_payment_link_id": string | null,"raw_event": Json | null,"short_url": string | null,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_paise": number,"booking_id": string,"created_at"?: string,"currency"?: string,"id"?: string,"provider"?: string,"provider_order_id"?: string | null,"provider_payment_id"?: string | null,"provider_payment_link_id"?: string | null,"raw_event"?: Json | null,"short_url"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "amount_paise"?: number,"booking_id"?: string,"created_at"?: string,"currency"?: string,"id"?: string,"provider"?: string,"provider_order_id"?: string | null,"provider_payment_id"?: string | null,"provider_payment_link_id"?: string | null,"raw_event"?: Json | null,"short_url"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: false
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"email": string | null,"full_name": string,"id": string,"phone": string | null,"phone_verified_at": string | null,"role": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email"?: string | null,"full_name"?: string,"id": string,"phone"?: string | null,"phone_verified_at"?: string | null,"role"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string | null,"full_name"?: string,"id"?: string,"phone"?: string | null,"phone_verified_at"?: string | null,"role"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"properties": {
                  Row: {
                    "address": string,"amenities": (string)[],"base_guests": number,"bathrooms": number | null,"bedrooms": number | null,"beds": number | null,"cancellation_policy": string,"category": string,"city": string,"cleaning_fee_paise": number,"created_at": string,"description": string,"extra_guest_fee_paise": number,"host_name": string | null,"id": string,"is_featured": boolean,"is_verified": boolean,"latitude": number | null,"longitude": number | null,"max_guests": number,"min_nights": number,"owner_id": string | null,"price_per_night_paise": number,"property_type": string,"rating": number,"review_count": number,"service_fee_pct": number,"slug": string,"state": string,"status": string,"tagline": string,"title": string,"updated_at": string,"weekend_price_per_night_paise": number | null,"zip_code": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string,"amenities"?: (string)[],"base_guests"?: number,"bathrooms"?: number | null,"bedrooms"?: number | null,"beds"?: number | null,"cancellation_policy"?: string,"category": string,"city": string,"cleaning_fee_paise"?: number,"created_at"?: string,"description"?: string,"extra_guest_fee_paise"?: number,"host_name"?: string | null,"id"?: string,"is_featured"?: boolean,"is_verified"?: boolean,"latitude"?: number | null,"longitude"?: number | null,"max_guests": number,"min_nights"?: number,"owner_id"?: string | null,"price_per_night_paise": number,"property_type": string,"rating"?: number,"review_count"?: number,"service_fee_pct"?: number,"slug": string,"state"?: string,"status"?: string,"tagline"?: string,"title": string,"updated_at"?: string,"weekend_price_per_night_paise"?: number | null,"zip_code"?: string | null
                  }
                  Update: {
                    "address"?: string,"amenities"?: (string)[],"base_guests"?: number,"bathrooms"?: number | null,"bedrooms"?: number | null,"beds"?: number | null,"cancellation_policy"?: string,"category"?: string,"city"?: string,"cleaning_fee_paise"?: number,"created_at"?: string,"description"?: string,"extra_guest_fee_paise"?: number,"host_name"?: string | null,"id"?: string,"is_featured"?: boolean,"is_verified"?: boolean,"latitude"?: number | null,"longitude"?: number | null,"max_guests"?: number,"min_nights"?: number,"owner_id"?: string | null,"price_per_night_paise"?: number,"property_type"?: string,"rating"?: number,"review_count"?: number,"service_fee_pct"?: number,"slug"?: string,"state"?: string,"status"?: string,"tagline"?: string,"title"?: string,"updated_at"?: string,"weekend_price_per_night_paise"?: number | null,"zip_code"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "properties_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "owners"
      referencedColumns: ["id"]
    }
                  ]
                },"property_images": {
                  Row: {
                    "alt_text": string,"created_at": string,"external_url": string | null,"id": string,"property_id": string,"sort_order": number,"storage_path": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "alt_text"?: string,"created_at"?: string,"external_url"?: string | null,"id"?: string,"property_id": string,"sort_order"?: number,"storage_path"?: string | null
                  }
                  Update: {
                    "alt_text"?: string,"created_at"?: string,"external_url"?: string | null,"id"?: string,"property_id"?: string,"sort_order"?: number,"storage_path"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "property_images_property_id_fkey"
      columns: ["property_id"]
isOneToOne: false
      referencedRelation: "properties"
      referencedColumns: ["id"]
    }
                  ]
                },"reviews": {
                  Row: {
                    "author_name": string,"booking_id": string | null,"comment": string,"created_at": string,"id": string,"property_id": string,"rating": number,"status": string,"sub_ratings": NonNullable<Json>,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_name": string,"booking_id"?: string | null,"comment"?: string,"created_at"?: string,"id"?: string,"property_id": string,"rating": number,"status"?: string,"sub_ratings"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Update: {
                    "author_name"?: string,"booking_id"?: string | null,"comment"?: string,"created_at"?: string,"id"?: string,"property_id"?: string,"rating"?: number,"status"?: string,"sub_ratings"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reviews_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: true
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_property_id_fkey"
      columns: ["property_id"]
isOneToOne: false
      referencedRelation: "properties"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "admin_list_customers":
{ Args: Record<PropertyKey, never>; Returns: {
              "booking_count": number,"created_at": string,"email": string | null,"full_name": string,"id": string,"last_request_at": string | null,"last_sign_in_at": string | null,"phone": string | null,"phone_verified_at": string | null,"provider": string
            }[]
                           },
            "admin_set_phone_verified":
{ Args: { "p_user_id": string,"p_verified": boolean }; Returns: string | null
                           },
            "is_valid_phone":
{ Args: { "p_phone": string }; Returns: boolean
                           },
            "normalize_phone":
{ Args: { "p_phone": string }; Returns: string
                           },
            "my_bookings":
{ Args: Record<PropertyKey, never>; Returns: {
              "adults": number,"check_in": string,"check_out": string,"children": number,"created_at": string,"nights": number,"property_city": string,"property_id": string,"property_slug": string,"property_title": string,"reference": string,"status": string,"total_paise": number
            }[]
                           },
            "get_unavailable_ranges":
{ Args: { "p_from"?: string,"p_property_id": string,"p_to"?: string }; Returns: {
              "ends_on": string,"starts_on": string
            }[]
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_available":
{ Args: { "p_check_in": string,"p_check_out": string,"p_property_id": string }; Returns: boolean
                           },
"quote_stay":
{ Args: { "p_adults"?: number,"p_check_in": string,"p_check_out": string,"p_children"?: number,"p_property_id": string }; Returns: Json
                           },
"request_booking":
{ Args: { "p_adults"?: number,"p_check_in": string,"p_check_out": string,"p_children"?: number,"p_guest_email"?: string,"p_guest_name": string,"p_guest_phone"?: string,"p_property_id": string,"p_special_requests"?: string }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
