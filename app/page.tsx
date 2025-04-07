"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRef, useState } from "react";
import { z } from "zod";
import { toPng } from "html-to-image";
import { saveAs } from "file-saver";

import { Loader2, ImageDown, File } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import Papa from "papaparse";

const FormSchema = z.object({
  primeDigits: z.coerce
    .number()
    .min(1, { message: "The number must have at least 1 digit." })
    .max(1500, { message: "The number of digits must not exceed 1500." }),
  iter: z.coerce
    .number()
    .min(5, { message: "There must be at least 5 iterations." })
    .max(100, { message: "The number of iterations must not exceed 100." }),
});

const chartConfig = {
  time: {
    label: "Time (s):",
  },
} satisfies ChartConfig;

export default function Home() {
  type ResultType = { prime: number; time: number };
  const [results, setResults] = useState<ResultType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [averageTime, setAverageTime] = useState(0);
  const elementRef = useRef<HTMLDivElement | null>(null);

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      primeDigits: 100,
      iter: 5,
    },
  });

  function fetchPrimes() {
    setIsLoading(true);
    setResults([]);
    setAverageTime(0);

    const eventSource = new EventSource(
      `/api/py/generate_prime?primeDigits=${form.getValues("primeDigits")}&iter=${form.getValues("iter")}`,
    );

    // const eventSource = new EventSource(
    //   `http://127.0.0.1:8000/api/py/generate_prime?primeDigits=${form.getValues("primeDigits")}&iter=${form.getValues("iter")}`,
    // );

    eventSource.onmessage = (event) => {
      console.log("Received:", event.data); // Debugging

      if (event.data.trim() !== "") {
        try {
          const newPrime = JSON.parse(event.data);
          setResults((prev) => {
            const updatedResults = [...prev, newPrime];
            const totalTime = updatedResults.reduce(
              (sum, item) => sum + item.time,
              0,
            );
            const avgTime = totalTime / updatedResults.length;
            setAverageTime(avgTime);
            return updatedResults;
          });
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      }
    };

    eventSource.onerror = (error) => {
      console.error("Error receiving data:", error);
      eventSource.close();
      setIsLoading(false);
    };

    eventSource.onopen = () => {
      console.log("Connection opened!");
    };

    eventSource.addEventListener("end", () => {
      console.log("Stream ended.");
      setIsLoading(false);
      eventSource.close();
    });
  }

  const htmlToImageConvert = async () => {
    if (!elementRef.current) {
      console.error("Element reference is null");
      return;
    }
    setIsSaving(true); // Hide button after processing
    try {
      const dataUrl = await toPng(elementRef.current, { cacheBust: false });

      const link = document.createElement("a");
      link.download = "prime-chart.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error converting to image:", err);
    } finally {
      setIsSaving(false); // Show button again after process completes
    }
  };

  const saveToCSV = () => {
    const csv = Papa.unparse(results);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "results.csv");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 sm:p-16 font-sans bg-purple-400 text-slate-800">
      {/* <h1 className="text-2xl sm:text-4xl md:text-6xl tracking-tight font-extrabold mb-4 sm:mb-8">&#119979;{'['}<span className="text-slate-50">n</span>{']'}</h1> */}
      <div className="grid md:grid-cols-5 gap-4 gap-x-0 max-w-5xl w-full">
        <div className="md:col-span-2 clip-path-left bg-slate-800 w-full min-h-100">
          <Card className="clip-path-left-inside rounded-none h-full bg-slate-50">
            <CardHeader className="pr-10">
              <CardTitle className="font-bold w-fit">
                Prime Number Generator
              </CardTitle>
              <CardDescription className="text-muted-foreground text-justify">
                Enter the desired number of digits and the quantity of prime
                numbers then click &#34;Generate&#34; to proceed.
              </CardDescription>
            </CardHeader>
            <Separator />

            <CardContent className="w-full space-y-4 pr-10">
              <Form {...form}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    fetchPrimes();
                  }}
                  className="w-full space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="primeDigits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Digits</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={1500}
                            className="bg-white border-slate-800 rounded-none border-2"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-muted-foreground text-xs">
                          The number of digits must be between 1 and 1500.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="iter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Iterations</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={5}
                            max={100}
                            className="bg-white border-slate-800 rounded-none border-2"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-muted-foreground text-xs">
                          The number of iterations must be between 5 and 100.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-4 mb-4 h-10">
                    {isLoading ? (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Loader2 className="animate-spin h-5 w-5" />
                        <span className="text-muted-foreground font-bold">
                          {" "}
                          Generating Primes...{" "}
                        </span>
                      </div>
                    ) : (
                      <Button
                        type="submit"
                        className="font-bold text-white bg-purple-500 hover:bg-purple-700 hover:box-shadow-lg rounded-none border border-3 border-b-6 border-slate-800 py-4 active:translate-y-1 active:border-b-3"
                      >
                        Generate
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-3 clip-path-right bg-slate-800 w-full">
          <Card
            ref={elementRef}
            className="clip-path-right-inside rounded-none h-full bg-slate-50"
          >
            <CardHeader className="pl-12">
              <CardTitle>Runtime Line Graph</CardTitle>
              <CardDescription>
                This chart shows the runtime of the prime number generation per
                iteration.
              </CardDescription>
            </CardHeader>

            <CardContent className="pl-10">
              <ChartContainer
                config={chartConfig}
                className="h-max max-h-48 w-full"
              >
                <LineChart
                  accessibilityLayer
                  data={results}
                  margin={{
                    left: 12,
                    right: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey={"index"}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    type="number" // Ensures proper numerical scaling
                    domain={["dataMin", "dataMax"]} // Automatically adjust to the full dataset
                    allowDecimals={false}
                    interval="preserveStartEnd"
                    tickFormatter={(value) => value}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={({ payload }) => {
                      if (!payload || payload.length === 0) return null;
                      const { index, time } = payload[0].payload; // Extracting index and time
                      return (
                        <div className="p-2 bg-white shadow-md rounded">
                          <p className="text-sm font-semibold">
                            Time: {time.toFixed(5)}s
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Index: {index}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <defs>
                    <linearGradient
                      id="purpleGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#C084FC" />
                      <stop offset="100%" stopColor="#6B21A8" />
                    </linearGradient>
                  </defs>
                  <Line
                    dataKey="time"
                    type="linear"
                    stroke="url(#purpleGradient)"
                    strokeWidth={2}
                    dot={false}
                    animationDuration={500}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>

            <Separator />
            <CardFooter className="flex items-center gap-2 text-sm justify-between">
              <div className="leading-none text-muted-foreground py-4 mb-3">
                <span className="text-foreground font-bold pl-6">Mean:</span>{" "}
                {averageTime.toFixed(4)}s
              </div>
              {!isSaving && results.length != 0 && (
                <Button
                  onClick={htmlToImageConvert}
                  className="font-bold text-white bg-purple-500 hover:bg-purple-700 hover:box-shadow-lg rounded-none border border-3 border-b-6 border-slate-800 py-4 active:translate-y-1 active:border-b-3"
                >
                  <ImageDown className="h-5 w-5" />
                  <span className="hidden sm:block">Download PNG</span>
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        <Card className="md:col-span-5 bg-slate-50 min-h-100 rounded-none border-slate-800 border-3 border-b-13">
          <CardHeader className="flex gap-4 pl-10 justify-between">
            <div className="grid gap-1">
              <CardTitle>Primes Generated</CardTitle>
              <CardDescription>
                All the prime numbers generated are shown here.
              </CardDescription>
            </div>
            {results.length != 0 && (
              <Button
                onClick={saveToCSV}
                className="font-bold text-white bg-purple-500 hover:bg-purple-700 hover:box-shadow-lg rounded-none border border-3 border-b-6 border-slate-800 py-4 active:translate-y-1 active:border-b-3"
              >
                <File className="h-5 w-5" />
                <span className="hidden sm:block">Download CSV</span>
              </Button>
            )}
          </CardHeader>

          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                {/* <Label htmlFor="name">Name</Label> */}
              </div>
              <div className="flex flex-col space-y-1.5 overflow-y-scroll max-h-60 mb-2">
                {results.length > 0 && (
                  <ul className="grid pr-8">
                    {results.map((item, index) => (
                      <li
                        key={index}
                        className="group grid grid-cols-[30px_1fr] items-start gap-2 hover:bg-purple-400 hover:text-slate-800 p-4"
                      >
                        <span className="text-muted-foreground group-hover:text-white">
                          {index + 1}
                        </span>
                        <div>
                          <span className="break-all font-bold group-hover:text-slate-900">
                            {item.prime}
                          </span>
                          <br />
                          <span className="text-xs text-muted-foreground group-hover:text-white">
                            Time: {item.time.toFixed(4)}s
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <p className="mt-8 text-xs text-center">
        {" "}
        This website is developed by{" "}
        <a href="https://github.com/mariware" className="font-bold">
          mariware
        </a>{" "}
        as part of a Machine Problem for CMSC 191.{" "}
        <br className="hidden sm:block" />
        The project team consists of lsrimando, rsbobadilla, and adgapud. All
        rights reserved.{" "}
      </p>
    </main>
  );
}
