declare module "react-native-ble-advertiser" {
  const BLEAdvertiser: {
    setCompanyId: (companyId: number) => void;
    broadcast: (
      uid: string,
      manufacturerData: number[],
      options: any,
    ) => Promise<any>;
    stopBroadcast: () => Promise<any>;
  };
  export default BLEAdvertiser;
}
