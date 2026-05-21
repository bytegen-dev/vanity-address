export interface PatternCriteria {
  startsWith?: string;
  endsWith?: string;
  contains?: string;
  caseSensitive?: boolean;
}

export interface CompiledPattern {
  startsWith: string;
  endsWith: string;
  contains: string;
  caseSensitive: boolean;
}

export function compilePattern(criteria: PatternCriteria): CompiledPattern {
  const caseSensitive = criteria.caseSensitive ?? false;
  const normalize = (value: string) =>
    caseSensitive ? value : value.toLowerCase();

  return {
    startsWith: normalize(criteria.startsWith ?? ""),
    endsWith: normalize(criteria.endsWith ?? ""),
    contains: normalize(criteria.contains ?? ""),
    caseSensitive,
  };
}

/** EVM addresses are matched without the 0x prefix. */
export function matchesPattern(
  value: string,
  pattern: CompiledPattern,
  stripPrefix = false
): boolean {
  const target = stripPrefix && value.startsWith("0x") ? value.slice(2) : value;
  const haystack = pattern.caseSensitive ? target : target.toLowerCase();

  if (pattern.startsWith && !haystack.startsWith(pattern.startsWith)) {
    return false;
  }
  if (pattern.endsWith && !haystack.endsWith(pattern.endsWith)) {
    return false;
  }
  if (pattern.contains && !haystack.includes(pattern.contains)) {
    return false;
  }

  return true;
}

export function hasActivePattern(pattern: CompiledPattern): boolean {
  return Boolean(
    pattern.startsWith || pattern.endsWith || pattern.contains
  );
}
