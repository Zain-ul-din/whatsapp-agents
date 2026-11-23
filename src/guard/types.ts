/** A piece of personal data found in a text, by character offsets. */
export type PiiSpan = {
  start: number;
  end: number;
  /** Placeholder tag, e.g. PHONE, EMAIL, PERSON */
  label: string;
};

/** Finds personal data in many texts at once; returns one span list per text. */
export type PiiDetector = (texts: string[]) => Promise<PiiSpan[][]>;
