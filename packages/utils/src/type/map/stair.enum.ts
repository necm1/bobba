import { Direction } from './direction';
import { StairType } from './stair-type.enum';

export type Stair = {
  type: StairType;
  direction: Direction;
};
