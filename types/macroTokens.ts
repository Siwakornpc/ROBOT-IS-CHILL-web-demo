type Token =
    | {
          type: "text";
          value: string;
          start: number;
          end: number;
      }
    | {
          type: "macro-bracket-open";
          value: "[";
          start: number;
          end: number;
          level: number;
          bid: number;
      }
    | {
          type: "macro-bracket-close";
          value: "]";
          start: number;
          end: number;
          level: number;
          bid: number;
      }
    | {
          type: "macro-name";
          value: string;
          start: number;
          end: number;
      }
    | {
          type: "macro-value";
          value: string;
          start: number;
          end: number;
      };