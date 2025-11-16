export interface Participant {
  id: string;
  full_name: string;
  phone_number: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  giver_id: string;
  receiver_id: string;
  created_at: string;
}


