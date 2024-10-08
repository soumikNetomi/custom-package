import colors from 'colors'

export function json(titleOrData, data) {
    if (typeof titleOrData === 'string') {
        console.log(titleOrData + '\n' + JSON.stringify(data, undefined, 2))
    } else {
        console.log(JSON.stringify(titleOrData, undefined, 2))
    }
}

export function enter(msg, ...args) {
    console.log("ENTER:".brightGreen, msg.brightGreen, ...args)
}

export function exit(msg, ...args) {
    console.info("EXIT: ".cyan, msg.cyan, ...args)
}

export function info(msg, ...args) {
    console.info("INFO: ", msg, ...args)
}

export function warn(msg, ...args) {
    console.warn("WARN: ".yellow, msg.yellow, ...args)
}

export function error(msg, ...args) {
    console.log("ERROR:".brightRed, msg.brightRed, ...args)
}

export function debug(msg, ...args) {
    console.debug("DEBUG:".grey, msg.grey, ...args)
}

export function result(msg) {
    const text = `${msg.exitcode}\t${msg.status}\t${msg.message}`
    info(text)
}

export function table(title, json) {
    console.info(title.blue)
    console.table(json)
}

export function table2(title, headerLine, columnSize, msgs) {
    info(title)
    let data = []
    const headers = headerLine.split(',')
    const pads = columnSize.split(',')
    data.push(headers.map((x, i) => x.padEnd(pads[i], ' ')).join('\t'))
    for (const msg of msgs) {
        let cols = []
        for (let i = 0; i < headers.length; i++) {
            if (msg.hasOwnProperty(headers[i])) {
                cols.push(('' + msg[headers[i]]).padEnd(pads[i], ' '))
            } else {
                cols.push(''.padEnd(pads[i], ' '))
            }
        }
        data.push(cols.join('\t'))
    }
    console.log(data.join('\n'))
}

function main() {
    enter("main()")
    warn("This is a warning!", "Please verify parameters")
    info("This is an information text!", "Further details see webpage")
    error("This is an error text", "status: 500")
    debug("This is a debug note", "Need to investigate")
    table2("Title", 'name,age,city', '10,5,20', [{ name: "James B", age: 20, city: "New York" }, { name: "Hercule P", age: 15, city: "SFO" }, { name: 'Agatha C', age: 33, city: 'London' }])
    table("Roster", [{ name: "James B", age: 20, city: "New York" }, { name: "Hercule P", age: 15, city: "SFO" }, { name: 'Agatha C', age: 33, city: 'London' }])
    exit("main()")
}

// main()