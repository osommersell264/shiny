import { priorityType, InputPolicy } from "./InputPolicy";
import { hasOwnProperty } from "../utils";
import { splitInputNameType } from "./splitInputNameType";

type lastSentValuesType = Record<string, Record<string, string>>;

class InputNoResendDecorator extends InputPolicy {
  lastSentValues: lastSentValuesType;

  constructor(target: InputPolicy, initialValues: lastSentValuesType = {}) {
    super();
    this.target = target;
    this.reset(initialValues);
  }

  setInput(
    nameType: string,
    value: unknown,
    opts: { priority: priorityType }
  ): void {
    const { name: inputName, inputType: inputType } =
      splitInputNameType(nameType);
    const jsonValue = JSON.stringify(value);

    if (
      opts.priority !== "event" &&
      this.lastSentValues[inputName] &&
      this.lastSentValues[inputName].jsonValue === jsonValue &&
      this.lastSentValues[inputName].inputType === inputType
    ) {
      return;
    }
    this.lastSentValues[inputName] = { jsonValue, inputType };
    this.target.setInput(nameType, value, opts);
  }
  reset(values = {}): void {
    // Given an object with flat name-value format:
    //   { x: "abc", "y.shiny.number": 123 }
    // Create an object in cache format and save it:
    //   { x: { jsonValue: '"abc"', inputType: "" },
    //     y: { jsonValue: "123", inputType: "shiny.number" } }
    const cacheValues = {};

    for (const inputName in values) {
      if (hasOwnProperty(values, inputName)) {
        const { name, inputType } = splitInputNameType(inputName);

        cacheValues[name] = {
          jsonValue: JSON.stringify(values[inputName]),
          inputType: inputType,
        };
      }
    }

    this.lastSentValues = cacheValues;
  }
  forget(name: string): void {
    delete this.lastSentValues[name];
  }
}

export { InputNoResendDecorator };
