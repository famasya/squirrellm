import { type ClassValue, clsx } from "clsx";
import { type EffectCallback, useEffect } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const useEffectOnce = (effect: EffectCallback) => {
	useEffect(effect, []);
};
