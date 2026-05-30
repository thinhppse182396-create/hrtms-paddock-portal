export interface HorseDocument {
  type: "Health Certificate" | "Registration Paper" | "Vaccination Record" | "Pedigree" | "Insurance";
  number: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate?: string;
  fileUrl?: string;
}

export interface Horse {
  id: string;
  name: string;
  breed: string;
  age: number;
  weight: number;
  ownerId: string;
  healthCertExpiry: string;
  status: "Eligible" | "Ineligible" | "Suspended";
  sire?: string;          
  dam?: string;         
  color?: string;
  microchipId?: string;
  trainer?: string;
  bio?: string;
  documents: HorseDocument[];
}
