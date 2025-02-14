import { Platform } from "react-native";

const LiveMap = Platform.OS === "web" ? require("./LiveMapWeb").default : require("./LiveMapMobile").default;

export default LiveMap;
