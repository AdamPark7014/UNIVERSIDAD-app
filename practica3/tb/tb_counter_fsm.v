// Testbench de la FSM y ruta de datos. Sigue la tabla de pruebas de la seccion 12.
`timescale 1ns/1ps
module tb_counter_fsm;

    reg clk = 0, reset = 1, tick = 0, pause_pulse = 0, inc_pulse = 0, dec_pulse = 0;
    wire signed [8:0] count;
    wire [1:0] state;
    integer errors = 0;

    localparam [1:0] S_PAUSE = 2'd0, S_UP = 2'd1, S_DOWN = 2'd2;

    signed_counter_fsm dut (
        .clk(clk), .reset(reset), .tick(tick),
        .pause_pulse(pause_pulse), .inc_pulse(inc_pulse), .dec_pulse(dec_pulse),
        .count(count), .state(state)
    );

    always #10 clk = ~clk;   // 50 MHz

    task pulse_inc;  begin inc_pulse = 1; @(posedge clk); #1 inc_pulse = 0; end endtask
    task pulse_dec;  begin dec_pulse = 1; @(posedge clk); #1 dec_pulse = 0; end endtask
    task pulse_pause; begin pause_pulse = 1; @(posedge clk); #1 pause_pulse = 0; end endtask
    task do_reset;  begin reset = 1; @(posedge clk); #1 reset = 0; end endtask
    task do_tick;   begin tick = 1; @(posedge clk); #1 tick = 0; end endtask
    task ticks(input integer n); integer i; begin for (i = 0; i < n; i = i + 1) do_tick; end endtask

    task check(input [8*40-1:0] name, input signed [8:0] exp_count, input [1:0] exp_state);
        begin
            if (count === exp_count && state === exp_state)
                $display("PASS  %0s -> count=%0d state=%0d", name, count, state);
            else begin
                $display("FAIL  %0s -> count=%0d (esperado %0d) state=%0d (esperado %0d)",
                         name, count, exp_count, state, exp_state);
                errors = errors + 1;
            end
        end
    endtask

    initial begin
        #1;
        @(posedge clk); #1; reset = 0;

        // Fila: 0, RESET -> 0, PAUSA
        do_reset; check("RESET desde arranque", 0, S_PAUSE);

        // Fila: 0, INC y despues tick -> 1, ASCENDENTE
        pulse_inc; do_tick; check("INC y tick (0 -> 1)", 1, S_UP);

        // Fila: 58, tick -> 59, ASCENDENTE
        ticks(57); check("57 ticks (1 -> 58)", 58, S_UP);
        do_tick;   check("tick (58 -> 59)", 59, S_UP);

        // Fila: 255, tick -> -256, ASCENDENTE (wrap)
        ticks(196); check("196 ticks (59 -> 255)", 255, S_UP);
        do_tick;    check("tick (255 -> -256)", -256, S_UP);

        // Fila: 0, DEC y despues tick -> -1, DESCENDENTE
        do_reset; pulse_dec; do_tick; check("DEC y tick (0 -> -1)", -1, S_DOWN);

        // Fila: -58, tick -> -59, DESCENDENTE
        ticks(57); check("57 ticks (-1 -> -58)", -58, S_DOWN);
        do_tick;   check("tick (-58 -> -59)", -59, S_DOWN);

        // Fila: -256, tick -> 255, DESCENDENTE (wrap)
        ticks(197); check("197 ticks (-59 -> -256)", -256, S_DOWN);
        do_tick;    check("tick (-256 -> 255)", 255, S_DOWN);

        // Fila: 45, PAUSA y varios ticks -> 45, PAUSA
        do_reset; pulse_inc; ticks(45); check("45 ticks (0 -> 45)", 45, S_UP);
        pulse_pause; ticks(5); check("PAUSA y 5 ticks (45)", 45, S_PAUSE);

        // Fila: -123, RESET -> 0, PAUSA
        do_reset; pulse_dec; ticks(123); check("DEC y 123 ticks (0 -> -123)", -123, S_DOWN);
        do_reset; check("RESET desde -123", 0, S_PAUSE);

        // Prioridad: PAUSA gana a INC en el mismo ciclo
        pulse_inc; ticks(3);
        @(posedge clk); #1 begin inc_pulse = 1; pause_pulse = 1; end
        @(posedge clk); #1 begin inc_pulse = 0; pause_pulse = 0; end
        check("PAUSA+INC simultaneos -> PAUSA", 3, S_PAUSE);

        $display("------------------------------");
        if (errors == 0) $display("RESULTADO: TODAS LAS PRUEBAS PASARON");
        else             $display("RESULTADO: %0d PRUEBA(S) FALLARON", errors);
        $finish;
    end

endmodule
