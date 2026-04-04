export type DriverFormValues = {
  name: string;
  email: string;
  phone: string;
  license_number: string;
  license_expires_at: string;
  is_active: boolean;
};

export function createEmptyDriverFormValues(): DriverFormValues {
  return {
    name: '',
    email: '',
    phone: '',
    license_number: '',
    license_expires_at: '',
    is_active: true,
  };
}
