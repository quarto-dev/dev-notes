function Div(div)
    if div.classes:includes("cell-output") and div.classes:includes("cell-output-stderr") then
        return {}
    end
end