import { Request, Response } from "express";

export const getHotlines = (req: Request, res: Response): void => {
  const hotlines: {
    name: string;
    phone: string;
    description: string;
  }[] = [
    {
      name: "สายด่วนฉุกเฉิน",
      phone: "1669",
      description: "อุบัติเหตุ เจ็บป่วยฉุกเฉิน"
    }
  ];

  res.status(200).json({
    success: true,
    data: hotlines
  });
};