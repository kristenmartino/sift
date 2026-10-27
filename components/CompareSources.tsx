"use client";

import { createContext, useContext } from "react";
import { COMPARE_SOURCES } from "@/lib/constants";
import type { CompareSource } from "@/lib/compareSources";

const CompareSourcesContext = createContext<readonly CompareSource[]>(COMPARE_SOURCES);
export const CompareSourcesProvider = CompareSourcesContext.Provider;
export const useCompareSources = () => useContext(CompareSourcesContext);
