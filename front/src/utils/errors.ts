// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Gonzalo Ponce <gonzalo@dowar.xyz>

type TypeError = "defaultError" | "authError" | "system";

export function errorBuilder(params: {
  typeError?: TypeError;
  message: string;
}): Error {
  const { typeError = "defaultError", message } = params;

  if (typeError == "authError") return new AuthError(message);
  else return new DefaultError(message);
}

class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

class DefaultError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Unknown Error";
  }
}
