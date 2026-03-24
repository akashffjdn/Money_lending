export const IndianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry',
  'Chandigarh', 'Andaman & Nicobar', 'Dadra & Nagar Haveli', 'Lakshadweep',
] as const;

export const PincodeLookup: Record<string, { city: string; state: string }> = {
  '600001': { city: 'Chennai', state: 'Tamil Nadu' },
  '110001': { city: 'New Delhi', state: 'Delhi' },
  '400001': { city: 'Mumbai', state: 'Maharashtra' },
  '625001': { city: 'Madurai', state: 'Tamil Nadu' },
  '560001': { city: 'Bengaluru', state: 'Karnataka' },
  '500001': { city: 'Hyderabad', state: 'Telangana' },
  '700001': { city: 'Kolkata', state: 'West Bengal' },
  '380001': { city: 'Ahmedabad', state: 'Gujarat' },
  '302001': { city: 'Jaipur', state: 'Rajasthan' },
  '226001': { city: 'Lucknow', state: 'Uttar Pradesh' },
};
