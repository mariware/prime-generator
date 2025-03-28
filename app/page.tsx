"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import { toast } from "@/hooks/use-toast";
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
  ChartTooltipContent,
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
  const [averageTime, setAverageTime] = useState(0);

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
      `http://127.0.0.1:8000/generate_prime?primeDigits=${form.getValues("primeDigits")}&iter=${form.getValues("iter")}`,
    );

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
      console.error("Error receiving data", error);
      eventSource.close();
      setIsLoading(false);
      toast({ title: "Error fetching data" });
    };

    eventSource.onopen = () => {
      console.log("Connection opened!");
    };

    eventSource.addEventListener("end", () => {
      console.log("Stream ended");
      setIsLoading(false);
      eventSource.close();
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-8">
        Prime Number Generator
      </h1>
      <div className="grid md:grid-cols-5 gap-4 max-w-5xl">
        <Card className="md:col-span-2 h-full justify-center">
          <CardContent className="w-full mt-6 space-y-4">
            <CardDescription className="text-muted-foreground tracking-tight text-justify">
              Enter the desired number of digits and the quantity of prime
              numbers then click &#34;Generate&#34; to proceed.
            </CardDescription>
            <Separator />
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
                        <Input type="number" min={1} max={1500} {...field} />
                      </FormControl>
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
                        <Input type="number" min={5} max={100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-4">
                  {isLoading ? (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Loader2 className="animate-spin h-5 w-5" />
                      <span className="text-muted-foreground">
                        {" "}
                        Generating Primes...{" "}
                      </span>
                    </div>
                  ) : (
                    <Button type="submit">Generate</Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Runtime Line Graph</CardTitle>
            <CardDescription>
              This chart shows the runtime of the prime number generation per
              iteration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
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
                          Time: {time.toFixed(4)}s
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Index: {index}
                        </p>
                      </div>
                    );
                  }}
                />
                <Line
                  dataKey="time"
                  type="linear"
                  stroke="#000000"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={500}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="leading-none text-muted-foreground">
              Average Runtime: {averageTime.toFixed(4)}s
            </div>
          </CardFooter>
        </Card>
        <Card className="md:col-span-5">
          <CardHeader>
            <CardTitle>Primes Generated</CardTitle>
            <CardDescription>
              All the prime numbers generated are shown here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                {/* <Label htmlFor="name">Name</Label> */}
              </div>
              <div className="flex flex-col space-y-1.5 max-h-72 overflow-y-scroll">
                {results.length > 0 && (
                  <ul className="grid gap-2">
                    {results.map((item, index) => (
                      <li
                        key={index}
                        className="grid grid-cols-[30px_1fr] items-start gap-2"
                      >
                        <span className="text-muted-foreground">
                          {index + 1}
                        </span>
                        <div>
                          <span className="break-all">{item.prime}</span>
                          <br />
                          <span className="text-xs text-muted-foreground">
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
    </main>
  );
}
