import "./load-env.js";

import { TRANSIT_CORE_VERSION } from "@steel-city/transit-core";
import { startRealtimePolling } from "./realtime-poll.js";

console.log(`[worker] started (transit-core ${TRANSIT_CORE_VERSION})`);
startRealtimePolling();
