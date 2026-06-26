declare module "react-native-ble-peripheral" {
  const BLEPeripheral: {
    setName: (name: string) => void;
    addService: (uuid: string, isPrimary: boolean) => void;
    start: () => Promise<string>;
    stop: () => void;
    // You can add more specific method signatures here if needed later,
    // but declaring it like this immediately satisfies the compiler.
  };
  export default BLEPeripheral;
}
