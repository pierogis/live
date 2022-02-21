declare namespace svelte.JSX {
  interface HTMLAttributes<T> {
    onnear?: (event: CustomEvent<boolean>) => void;
  }
}
