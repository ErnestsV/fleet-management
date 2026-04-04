export type VehicleFormValues = {
  name: string;
  plate_number: string;
  vin: string;
  make: string;
  model: string;
  year: string;
  device_identifier: string;
  is_active: boolean;
};

export function createEmptyVehicleFormValues(): VehicleFormValues {
  return {
    name: '',
    plate_number: '',
    vin: '',
    make: '',
    model: '',
    year: '',
    device_identifier: '',
    is_active: true,
  };
}
