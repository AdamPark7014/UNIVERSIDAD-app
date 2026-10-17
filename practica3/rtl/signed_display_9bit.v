// Muestra un numero con signo de 9 bits en decimal en HEX2..HEX0.
// HEX3 muestra el signo negativo (segmento g). Salidas activas en bajo (DE10-Lite).
// Los ceros a la izquierda se apagan.
module signed_display_9bit (
    input  wire signed [8:0] value,
    output wire        [6:0] HEX0,
    output wire        [6:0] HEX1,
    output wire        [6:0] HEX2,
    output wire        [6:0] HEX3
);

    localparam [6:0] BLANK = 7'b111_1111;
    localparam [6:0] MINUS = 7'b011_1111;  // solo g encendido

    // Magnitud: 10 bits para representar |-256| = 256
    wire signed [9:0] v10 = value;
    wire        [9:0] mag = v10[9] ? (~v10 + 10'd1) : v10[9:0];

    wire [3:0] units    = mag % 10;
    wire [3:0] tens     = (mag / 10) % 10;
    wire [3:0] hundreds = mag / 100;

    wire hide_hundreds = (hundreds == 0);
    wire hide_tens     = hide_hundreds && (tens == 0);

    function [6:0] seg7;   // decodificador BCD -> 7 segmentos, activo en bajo
        input [3:0] d;
        begin
            case (d)
                4'd0: seg7 = 7'b100_0000;
                4'd1: seg7 = 7'b111_1001;
                4'd2: seg7 = 7'b010_0100;
                4'd3: seg7 = 7'b011_0000;
                4'd4: seg7 = 7'b001_1001;
                4'd5: seg7 = 7'b001_0010;
                4'd6: seg7 = 7'b000_0010;
                4'd7: seg7 = 7'b111_1000;
                4'd8: seg7 = 7'b000_0000;
                4'd9: seg7 = 7'b001_0000;
                default: seg7 = 7'b111_1111;
            endcase
        end
    endfunction

    assign HEX0 = seg7(units);
    assign HEX1 = hide_tens     ? BLANK : seg7(tens);
    assign HEX2 = hide_hundreds ? BLANK : seg7(hundreds);
    assign HEX3 = value[8]      ? MINUS : BLANK;

endmodule
