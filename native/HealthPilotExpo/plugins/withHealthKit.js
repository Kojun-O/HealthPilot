const {
  withEntitlementsPlist,
  withInfoPlist,
} = require("@expo/config-plugins");

function withHealthKit(config) {
  config = withEntitlementsPlist(config, (configWithEntitlements) => {
    const entitlements = configWithEntitlements.modResults;

    entitlements["com.apple.developer.healthkit"] = true;

    return configWithEntitlements;
  });

  config = withInfoPlist(config, (configWithInfo) => {
    const infoPlist = configWithInfo.modResults;

    if (!infoPlist.NSHealthShareUsageDescription) {
      infoPlist.NSHealthShareUsageDescription =
        "Health Pilot reads sleep data to recommend one clear daily action.";
    }

    if (!infoPlist.NSHealthUpdateUsageDescription) {
      infoPlist.NSHealthUpdateUsageDescription =
        "Health Pilot may write selected health data only if you choose to enable it.";
    }

    return configWithInfo;
  });

  return config;
}

module.exports = withHealthKit;
