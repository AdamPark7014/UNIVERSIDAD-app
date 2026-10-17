// Prueba del decodificador de 7 segmentos (signo y digitos) y del periodo de tick a 100 ms.
`timescale 1ns/1ps
module tb_display_tick;

    // ---------- Display ----------
    reg  signed [8:0] value;
    wire [6:0] HEX0, HEX1, HEX2, HEX3;
    integer errors = 0;

    signed_display_9bit disp (.value(value), .HEX0(HEX0), .HEX1(HEX1), .HEX2(HEX2), .HEX3(HEX3));

    task show_and_check(input signed [8:0] v, input [6:0] e3, input [6:0] e2,
                        input [6:0] e1, input [6:0] e0);
        begin
            value = v; #5;
            $display("valor %4d : HEX3=%b HEX2=%b HEX1=%b HEX0=%b", v, HEX3, HEX2, HEX1, HEX0);
            if ({HEX3,HEX2,HEX1,HEX0} !== {e3,e2,e1,e0}) begin
                $display("  FAIL: esperado HEX3=%b HEX2=%b HEX1=%b HEX0=%b", e3, e2, e1, e0);
                errors = errors + 1;
            end
        end
    endtask

    localparam [6:0] BL = 7'b111_1111, MN = 7'b011_1111;
    localparam [6:0] D0 = 7'b100_0000, D1 = 7'b111_1001, D2 = 7'b010_0100, D3 = 7'b011_0000,
                     D4 = 7'b001_1001, D5 = 7'b001_0010, D6 = 7'b000_0010;

    // ---------- Tick ----------
    reg clk = 0, reset = 1, enable = 0, speed_sel = 1;
    wire tick;
    always #10 clk = ~clk;
    tick_generator tg (.clk(clk), .reset(reset), .enable(enable), .speed_sel(speed_sel), .tick(tick));

    integer cycles;
    realtime t1, t2;

    initial begin
        value = 0;
        show_and_check( 255, BL, D2, D5, D5);
        show_and_check(-256, MN, D2, D5, D6);
        show_and_check(  -1, MN, BL, BL, D1);
        show_and_check(   0, BL, BL, BL, D0);
        show_and_check(  45, BL, BL, D4, D5);
        show_and_check(-123, MN, D1, D2, D3);
        show_and_check( 100, BL, D1, D0, D0);

        // Periodo de tick a 100 ms: se espera 5 000 000 ciclos entre pulsos
        #1; reset = 1; #40; reset = 0; enable = 1;
        @(posedge tick); t1 = $realtime;
        @(posedge tick); t2 = $realtime;
        cycles = (t2 - t1) / 20;   // reloj de 50 MHz = 20 ns por ciclo
        $display("Periodo medido entre ticks a 100 ms: %0d ciclos (esperado 5000000)", cycles);
        if (cycles !== 5000000) begin
            $display("  FAIL"); errors = errors + 1;
        end

        $display("------------------------------");
        if (errors == 0) $display("RESULTADO: TODAS LAS PRUEBAS PASARON");
        else             $display("RESULTADO: %0d PRUEBA(S) FALLARON", errors);
        $finish;
    end

endmodule
