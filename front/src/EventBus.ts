// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import mitt from "mitt";
const emitter = mitt();
const eventBus = (): { emitter: ReturnType<typeof mitt> } => {
  return { emitter };
};
export default eventBus;
