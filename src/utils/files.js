import fse from 'fs-extra';
import * as log from './log.js';
import csv from 'csvtojson';
import jsonexport from 'jsonexport';

export async function readLocalFile(path, file) {
	const data = await fse.promises.readFile(`${path}/${file}`, 'utf-8');
	return data;
}

export function readCsvFile(path, file) {
	log.debug('readCsvFile', path, file);
	if (fse.existsSync(`${path}/${file}`)) {
		return fse.readFileSync(`${path}/${file}`, 'utf-8');
	}
	return null;
}

export function writeCsvFile(path, file, csvHeader, csvList) {
	log.debug('writeCsvFile', path, file);
	if (!fileExistsSync(`${path}/${file}`)) {
		fse.outputFileSync(`${path}/${file}`, csvHeader + '\n');
	}
	appendFileSync(path, file, csvList.join('\n'));
}

export function readTextFile(path, file) {
	log.debug('readTextFile', path, file);
	if (fse.existsSync(`${path}/${file}`)) {
		return fse.readFileSync(`${path}/${file}`, 'utf-8');
	}
	return null;
}

export function writeTextFile(path, file, text) {
	log.debug('writeTextFile', path, file);
	fse.outputFileSync(`${path}/${file}`, text);
}

export function readJSONFile(path, file) {
	log.debug('readJSONFile', path, file);
	const resolvedPath = `${path}/${file}`;
	if (fse.existsSync(resolvedPath)) {
		return JSON.parse(fse.readFileSync(resolvedPath));
	}
	log.error('failed to resolve paths', resolvedPath);
	return null;
}

export function readJSONFiles(path) {
	log.debug('readJSONFile', path);
	const jsonList = [];
	if (fse.existsSync(path)) {
		const filenames = fse.readdirSync(path);
		for (const f of filenames) {
			if (f.endsWith('.json')) {
				const json = readJSONFile(`${path}/${f}`);
				console.log('reading: ', f);
				jsonList.push(json);
			}
		}
	}
	return jsonList;
}

export async function readCsvAsJSONFile(path, csvFileName) {
	const json = await csv().fromFile(`${path}/${csvFileName}`);
	// log.json("json", json)
	return json;
}

// export async function writeJsonAsCsv(path, json, _options) {
// 	let defaultOptions = {lang: 'Node.js', module: 'jsonexport', forceTextDelimiter: true}
// 	let options = Object.assign({}, defaultOptions, _options);
//     const csv = await jsonexport(json, options)
//     writeTextFile(path, csv)
// }

export async function writeJSONAsCsv(path, file, json, includeHeaders = true) {
	const csv = await jsonexport(json, { lang: 'Node.js', module: 'jsonexport', forceTextDelimiter: false, includeHeaders });
	writeTextFile(path, file, csv);
}

export function writeJSONFile(path, file, json) {
  if (!json) return;
	log.debug('writeJSONFile', path, file);
  // fse.mkdirSync(path);
	fse.outputFileSync(`${path}/${file}`, JSON.stringify(json, undefined, 2));
}

export function readConfig(key, file = 'config.json') {
	const p0 = process.cwd() + '/../../config';
	log.enter(`readConfig(${key})`, key, p0);
	return readJSONFile(p0, file)[key];
}

export function appendFileSync(path, file, data) {
	fse.appendFileSync(`${path}/${file}`, data);
}

export function fileExistsSync(path, file) {
	if (file) {
		return fse.existsSync(`${path}/${file}`);
	}
	return fse.existsSync(path);
}

export function gunzip(data, code = 'base64') {
	const buffer = Buffer.from(data, code);
	const binaryArray = ungzip(buffer);
	return String.fromCharCode.apply(null, binaryArray);
}

export function matchPattern(text, str) {
	const regex = new RegExp(str, 'gm');
	const result = regex.exec(text);
	// log.info("Result", result)
	return result;
}
